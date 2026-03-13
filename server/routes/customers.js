const express = require('express')
const { query } = require('../config/database')
const { requireRole } = require('./auth')
const { isMailConfigured, sendEmail } = require('../utils/mailer')
const { isSmsConfigured, sendSms } = require('../utils/messaging')

const router = express.Router()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email) {
  if (!email || !email.trim()) return null
  return email.trim().toLowerCase()
}

function normalizePhone(phone) {
  if (!phone || !phone.trim()) return null
  return phone.replace(/[^\d+]/g, '').trim() || null
}

function buildCampaignEmail({ customerName, title, message }) {
  const subject = title?.trim() || 'Nuevas ofertas para ti'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">${subject}</h1>
      <p style="font-size: 16px; line-height: 1.6;">Hola ${customerName || 'cliente'},</p>
      <div style="font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${message}</div>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        Gracias por preferirnos.
      </p>
    </div>
  `

  const text = `Hola ${customerName || 'cliente'},\n\n${message}\n\nGracias por preferirnos.`

  return { subject, html, text }
}

// ============================================
// GET /api/customers
// ============================================
router.get('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const search = req.query.q?.trim()
    const params = []

    let sql = `
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.accepts_email,
        c.accepts_sms,
        c.accepts_whatsapp,
        c.created_at,
        l.name as registered_location_name
      FROM customers c
      LEFT JOIN locations l ON l.id = c.registered_location_id
      WHERE c.active = true
    `

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      sql += `
        AND (
          LOWER(c.name) LIKE $${params.length}
          OR LOWER(COALESCE(c.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(c.phone, '')) LIKE $${params.length}
        )
      `
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 500'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/customers
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      accepts_email = true,
      accepts_sms = true,
      accepts_whatsapp = true,
    } = req.body || {}

    const cleanName = name?.trim()
    const cleanEmail = normalizeEmail(email)
    const cleanPhone = normalizePhone(phone)

    if (!cleanName) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ error: 'Debes indicar email o telefono' })
    }

    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'El email no es valido' })
    }

    const existing = await query(
      `
      SELECT *
      FROM customers
      WHERE active = true
        AND (
          ($1::text IS NOT NULL AND email = $1)
          OR ($2::text IS NOT NULL AND phone = $2)
        )
      LIMIT 1
      `,
      [cleanEmail, cleanPhone]
    )

    if (existing.rows.length > 0) {
      const updated = await query(
        `
        UPDATE customers
        SET
          name = $1,
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          accepts_email = $4,
          accepts_sms = $5,
          accepts_whatsapp = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, email, phone, accepts_email, accepts_sms, accepts_whatsapp, created_at, updated_at
        `,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          Boolean(accepts_email),
          Boolean(accepts_sms),
          Boolean(accepts_whatsapp),
          existing.rows[0].id
        ]
      )

      return res.json({
        ...updated.rows[0],
        updatedExisting: true,
      })
    }

    const result = await query(
      `
      INSERT INTO customers (
        name,
        email,
        phone,
        accepts_email,
        accepts_sms,
        accepts_whatsapp,
        registered_location_id,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, phone, accepts_email, accepts_sms, accepts_whatsapp, created_at
      `,
      [
        cleanName,
        cleanEmail,
        cleanPhone,
        Boolean(accepts_email),
        Boolean(accepts_sms),
        Boolean(accepts_whatsapp),
        req.location?.id || null,
        req.user?.id || null,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/customers/campaigns
// ============================================
router.get('/campaigns', requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        id,
        title,
        channel,
        status,
        recipient_count,
        sent_count,
        failed_count,
        created_at
      FROM customer_campaigns
      ORDER BY created_at DESC
      LIMIT 25
      `
    )

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/customers/campaigns/send
// ============================================
router.post('/campaigns/send', requireRole('admin'), async (req, res) => {
  try {
    const { title, message, channel = 'email' } = req.body || {}
    const cleanTitle = title?.trim() || 'Nueva oferta'
    const cleanMessage = message?.trim()
    const cleanChannel = channel === 'sms' ? 'sms' : 'email'

    if (!cleanMessage) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    if (cleanChannel === 'email' && !isMailConfigured()) {
      return res.status(400).json({ error: 'SMTP no esta configurado para enviar emails' })
    }

    if (cleanChannel === 'sms' && !isSmsConfigured()) {
      return res.status(400).json({ error: 'Twilio SMS no esta configurado' })
    }

    const recipientQuery = cleanChannel === 'email'
      ? `
        SELECT id, name, email, phone
        FROM customers
        WHERE active = true
          AND accepts_email = true
          AND email IS NOT NULL
        ORDER BY name ASC
      `
      : `
        SELECT id, name, email, phone
        FROM customers
        WHERE active = true
          AND accepts_sms = true
          AND phone IS NOT NULL
        ORDER BY name ASC
      `

    const recipientsResult = await query(recipientQuery)
    const recipients = recipientsResult.rows

    const campaignInsert = await query(
      `
      INSERT INTO customer_campaigns (
        title,
        message,
        channel,
        status,
        recipient_count,
        sent_count,
        failed_count,
        created_by,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7::jsonb)
      RETURNING id, title, channel, status, recipient_count, sent_count, failed_count, created_at
      `,
      [
        cleanTitle,
        cleanMessage,
        cleanChannel,
        recipients.length > 0 ? 'processing' : 'no_recipients',
        recipients.length,
        req.user.id,
        JSON.stringify({ preview: recipients.slice(0, 10) }),
      ]
    )

    const campaign = campaignInsert.rows[0]

    if (recipients.length === 0) {
      return res.json({ campaign, recipients: [] })
    }

    const results = await Promise.allSettled(
      recipients.map((recipient) => {
        if (cleanChannel === 'sms') {
          return sendSms({
            to: recipient.phone,
            body: `${cleanTitle}\n\n${cleanMessage}`,
          })
        }

        const mail = buildCampaignEmail({
          customerName: recipient.name,
          title: cleanTitle,
          message: cleanMessage,
        })

        return sendEmail({
          to: recipient.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        })
      })
    )

    const sentCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - sentCount

    const updated = await query(
      `
      UPDATE customer_campaigns
      SET
        status = $1,
        sent_count = $2,
        failed_count = $3,
        metadata = $4::jsonb
      WHERE id = $5
      RETURNING id, title, channel, status, recipient_count, sent_count, failed_count, created_at
      `,
      [
        failedCount === 0 ? 'sent' : sentCount > 0 ? 'partial' : 'failed',
        sentCount,
        failedCount,
        JSON.stringify({
          failedRecipients: recipients
            .map((recipient, index) => ({ recipient, result: results[index] }))
            .filter(({ result }) => result.status === 'rejected')
            .map(({ recipient, result }) => ({
              id: recipient.id,
              name: recipient.name,
              email: recipient.email,
              phone: recipient.phone,
              error: result.reason?.message || 'Error al enviar',
            })),
        }),
        campaign.id,
      ]
    )

    res.json({
      campaign: updated.rows[0],
      sentCount,
      failedCount,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
