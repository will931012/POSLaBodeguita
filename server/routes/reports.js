const express = require('express')
const { query } = require('../config/database')
const router = express.Router()

// GET /report/close
router.get('/close', async (req, res) => {
  try {
    const day = req.query.day || new Date().toISOString().split('T')[0]
    
    const totalResult = await query(
      `SELECT COALESCE(SUM(total), 0) AS total 
       FROM sales 
       WHERE DATE(created_at) = $1 AND location_id = $2`,
      [day, req.location.id]
    )
    const total = parseFloat(totalResult.rows[0].total || 0)

    const methodResult = await query(
      `SELECT payment_method, COALESCE(SUM(total), 0) AS amt 
       FROM sales 
       WHERE DATE(created_at) = $1 AND location_id = $2
       GROUP BY payment_method`,
      [day, req.location.id]
    )
    const byMethod = { cash: 0, card: 0, other: 0 }
    methodResult.rows.forEach(row => {
      const key = (row.payment_method || 'other').toLowerCase()
      byMethod[key] = parseFloat(row.amt || 0)
    })

    const countResult = await query(
      `SELECT COUNT(*) AS count 
       FROM sales 
       WHERE DATE(created_at) = $1 AND location_id = $2`,
      [day, req.location.id]
    )
    const salesCount = parseInt(countResult.rows[0].count || 0)

    res.json({ ok: true, data: { day, total, byMethod, salesCount } })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

// POST /report/close
router.post('/close', async (req, res) => {
  try {
    const { day, counted_cash, counted_card } = req.body
    const dayStr = day || new Date().toISOString().split('T')[0]

    const closeResult = await query(
      `SELECT COALESCE(SUM(total), 0) AS total 
       FROM sales 
       WHERE DATE(created_at) = $1 AND location_id = $2`,
      [dayStr, req.location.id]
    )
    const total = parseFloat(closeResult.rows[0].total || 0)

    const methodResult = await query(
      `SELECT payment_method, COALESCE(SUM(total), 0) AS amt 
       FROM sales 
       WHERE DATE(created_at) = $1 AND location_id = $2
       GROUP BY payment_method`,
      [dayStr, req.location.id]
    )
    const byMethod = { cash: 0, card: 0, other: 0 }
    methodResult.rows.forEach(row => {
      const key = (row.payment_method || 'other').toLowerCase()
      byMethod[key] = parseFloat(row.amt || 0)
    })

    const countResult = await query(
      `SELECT COUNT(*) AS count 
       FROM sales 
       WHERE DATE(created_at) = $1 AND location_id = $2`,
      [dayStr, req.location.id]
    )
    const salesCount = parseInt(countResult.rows[0].count || 0)

    const expected_cash = parseFloat(byMethod.cash || 0)
    const expected_card = parseFloat(byMethod.card || 0)
    const counted_cash_num = parseFloat(counted_cash || 0)
    const counted_card_num = parseFloat(counted_card || 0)
    const counted_total = counted_cash_num + counted_card_num
    const diff_cash = counted_cash_num - expected_cash
    const diff_card = counted_card_num - expected_card
    const diff_total = counted_total - total

    await query(
      `INSERT INTO closures (day, total, by_method, counted_cash, counted_card, diff_cash, diff_card, diff_total, location_id, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [dayStr, total, JSON.stringify(byMethod), counted_cash_num, counted_card_num, diff_cash, diff_card, diff_total, req.location.id, req.user.id]
    )

    res.json({
      ok: true,
      data: {
        day: dayStr,
        expected: { cash: expected_cash, card: expected_card, total, salesCount },
        counted: { cash: counted_cash_num, card: counted_card_num, total: counted_total },
        diff: { cash: diff_cash, card: diff_card, total: diff_total },
      },
      email: { sent: false }
    })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

module.exports = router