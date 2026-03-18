const express = require('express')
const { query } = require('../config/database')
const { requireRole } = require('./auth')
const { isSmsConfigured, sendSms } = require('../utils/messaging')

const router = express.Router()

function normalizePhone(phone) {
  if (!phone || !phone.trim()) return null
  return phone.replace(/[^\d+]/g, '').trim() || null
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
        c.phone
      FROM customers c
      WHERE 1 = 1
    `

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      sql += `
        AND LOWER(COALESCE(c.phone, '')) LIKE $${params.length}
      `
    }

    sql += ' ORDER BY c.id DESC LIMIT 500'

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
    const { phone } = req.body || {}
    const cleanPhone = normalizePhone(phone)

    if (!cleanPhone) {
      return res.status(400).json({ error: 'Debes indicar un telefono' })
    }

    const existing = await query(
      `
      SELECT *
      FROM customers
      WHERE phone = $1
      LIMIT 1
      `,
      [cleanPhone]
    )

    if (existing.rows.length > 0) {
      const updated = await query(
        `
        UPDATE customers
        SET phone = $1
        WHERE id = $2
        RETURNING id, phone
        `,
        [
          cleanPhone,
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
      INSERT INTO customers (phone)
      VALUES ($1)
      RETURNING id, phone
      `,
      [cleanPhone]
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
    const { title, message, recipient_ids = [] } = req.body || {}
    const cleanTitle = title?.trim() || 'Nueva oferta'
    const cleanMessage = message?.trim()
    const cleanChannel = 'sms'
    const recipientIds = Array.isArray(recipient_ids)
      ? recipient_ids.map((id) => parseInt(id, 10)).filter(Number.isFinite)
      : []

    if (!cleanMessage) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    if (cleanChannel === 'sms' && !isSmsConfigured()) {
      return res.status(400).json({ error: 'Twilio SMS no esta configurado' })
    }

    const recipientQuery = `
      SELECT id, phone
      FROM customers
      WHERE phone IS NOT NULL
        ${recipientIds.length > 0 ? 'AND id = ANY($1)' : ''}
      ORDER BY phone ASC
    `

    const recipientsResult = await query(
      recipientQuery,
      recipientIds.length > 0 ? [recipientIds] : []
    )
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
      recipients.map((recipient) => (
        sendSms({
          to: recipient.phone,
          body: `${cleanTitle}\n\n${cleanMessage}`,
        })
      ))
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
