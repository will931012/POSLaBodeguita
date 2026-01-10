const express = require('express')
const { query } = require('../config/database')
const nodemailer = require('nodemailer')

const router = express.Router()

// GET /report/close - Get closing data for a day
router.get('/close', async (req, res) => {
  try {
    const day = req.query.day || new Date().toISOString().split('T')[0]
    
    // Get total sales
    const totalResult = await query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM sales
       WHERE DATE(created_at) = $1`,
      [day]
    )
    const total = parseFloat(totalResult.rows[0].total || 0)

    // Get sales by payment method
    const methodResult = await query(
      `SELECT payment_method, COALESCE(SUM(total), 0) AS amt
       FROM sales
       WHERE DATE(created_at) = $1
       GROUP BY payment_method`,
      [day]
    )

    const byMethod = { cash: 0, card: 0, other: 0 }
    methodResult.rows.forEach(row => {
      const key = (row.payment_method || 'other').toLowerCase()
      byMethod[key] = parseFloat(row.amt || 0)
    })

    // Get sales count
    const countResult = await query(
      `SELECT COUNT(*) AS count
       FROM sales
       WHERE DATE(created_at) = $1`,
      [day]
    )
    const salesCount = parseInt(countResult.rows[0].count || 0)

    res.json({
      ok: true,
      data: {
        day,
        total,
        byMethod,
        salesCount,
      },
    })
  } catch (error) {
    console.error('Get close data error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// POST /report/close - Close cash register
router.post('/close', async (req, res) => {
  try {
    const { day, counted_cash, counted_card } = req.body
    const dayStr = day || new Date().toISOString().split('T')[0]

    // Get expected amounts
    const closeData = await getCloseData(dayStr)
    
    const expected_cash = parseFloat(closeData.byMethod.cash || 0)
    const expected_card = parseFloat(closeData.byMethod.card || 0)
    const expected_total = parseFloat(closeData.total || 0)

    const counted_cash_num = parseFloat(counted_cash || 0)
    const counted_card_num = parseFloat(counted_card || 0)
    const counted_total = counted_cash_num + counted_card_num

    const diff_cash = counted_cash_num - expected_cash
    const diff_card = counted_card_num - expected_card
    const diff_total = counted_total - expected_total

    // Save closure
    await query(
      `INSERT INTO closures (day, total, by_method, counted_cash, counted_card, diff_cash, diff_card, diff_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        dayStr,
        expected_total,
        JSON.stringify(closeData.byMethod),
        counted_cash_num,
        counted_card_num,
        diff_cash,
        diff_card,
        diff_total,
      ]
    )

    // Send email if configured
    let emailResult = { sent: false }
    if (process.env.ENABLE_EMAIL === 'true' && process.env.SMTP_HOST) {
      try {
        emailResult = await sendCloseEmail({
          day: dayStr,
          expected: { cash: expected_cash, card: expected_card, total: expected_total },
          counted: { cash: counted_cash_num, card: counted_card_num, total: counted_total },
          diff: { cash: diff_cash, card: diff_card, total: diff_total },
          salesCount: closeData.salesCount,
        })
      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    res.json({
      ok: true,
      data: {
        day: dayStr,
        expected: { cash: expected_cash, card: expected_card, total: expected_total, salesCount: closeData.salesCount },
        counted: { cash: counted_cash_num, card: counted_card_num, total: counted_total },
        diff: { cash: diff_cash, card: diff_card, total: diff_total },
      },
      email: emailResult,
    })
  } catch (error) {
    console.error('Close error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

async function getCloseData(day) {
  const totalResult = await query(
    `SELECT COALESCE(SUM(total), 0) AS total FROM sales WHERE DATE(created_at) = $1`,
    [day]
  )
  const total = parseFloat(totalResult.rows[0].total || 0)

  const methodResult = await query(
    `SELECT payment_method, COALESCE(SUM(total), 0) AS amt FROM sales WHERE DATE(created_at) = $1 GROUP BY payment_method`,
    [day]
  )
  const byMethod = { cash: 0, card: 0, other: 0 }
  methodResult.rows.forEach(row => {
    const key = (row.payment_method || 'other').toLowerCase()
    byMethod[key] = parseFloat(row.amt || 0)
  })

  const countResult = await query(
    `SELECT COUNT(*) AS count FROM sales WHERE DATE(created_at) = $1`,
    [day]
  )
  const salesCount = parseInt(countResult.rows[0].count || 0)

  return { total, byMethod, salesCount }
}

async function sendCloseEmail(data) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const subject = `Cierre de Caja - ${data.day} | Total $${data.expected.total.toFixed(2)} (Δ $${data.diff.total.toFixed(2)})`
  
  const html = `
    <h2>Cierre de Caja - ${data.day}</h2>
    <h3>Ventas Esperadas</h3>
    <ul>
      <li>Efectivo: $${data.expected.cash.toFixed(2)}</li>
      <li>Tarjeta: $${data.expected.card.toFixed(2)}</li>
      <li>Total: $${data.expected.total.toFixed(2)}</li>
      <li>Número de ventas: ${data.salesCount}</li>
    </ul>
    <h3>Contado</h3>
    <ul>
      <li>Efectivo: $${data.counted.cash.toFixed(2)}</li>
      <li>Tarjeta: $${data.counted.card.toFixed(2)}</li>
      <li>Total: $${data.counted.total.toFixed(2)}</li>
    </ul>
    <h3>Diferencias</h3>
    <ul>
      <li>Efectivo: $${data.diff.cash.toFixed(2)}</li>
      <li>Tarjeta: $${data.diff.card.toFixed(2)}</li>
      <li>Total: $${data.diff.total.toFixed(2)}</li>
    </ul>
  `

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject,
    html,
  })

  return { sent: true, messageId: info.messageId }
}

module.exports = router
