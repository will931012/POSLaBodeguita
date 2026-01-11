const express = require('express')
const { query } = require('../config/database')

const router = express.Router()

// ============================================
// GET /report/close - Get closure data
// ============================================
router.get('/close', async (req, res) => {
  try {
    const { day } = req.query
    const locationId = req.location.id
    const date = day || new Date().toISOString().split('T')[0]

    const salesResult = await query(
      `SELECT 
         COUNT(*) as count,
         SUM(total) as total,
         SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash,
         SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card
       FROM sales
       WHERE location_id = $1 AND DATE(created_at) = $2`,
      [locationId, date]
    )

    const data = salesResult.rows[0]

    res.json({
      ok: true,
      data: {
        total: parseFloat(data.total || 0),
        salesCount: parseInt(data.count || 0),
        byMethod: {
          cash: parseFloat(data.cash || 0),
          card: parseFloat(data.card || 0),
        },
      },
    })
  } catch (error) {
    console.error('Close data error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /report/close - Close day
// ============================================
router.post('/close', async (req, res) => {
  try {
    const { day, counted_cash, counted_card } = req.body
    const locationId = req.location.id
    const userId = req.user.id

    const salesResult = await query(
      `SELECT 
         SUM(total) as total,
         SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as expected_cash,
         SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as expected_card
       FROM sales
       WHERE location_id = $1 AND DATE(created_at) = $2`,
      [locationId, day]
    )

    const expected = salesResult.rows[0]
    const expectedCash = parseFloat(expected.expected_cash || 0)
    const expectedCard = parseFloat(expected.expected_card || 0)

    const diffCash = counted_cash - expectedCash
    const diffCard = counted_card - expectedCard
    const diffTotal = diffCash + diffCard

    const closureResult = await query(
      `INSERT INTO closures (location_id, user_id, day, expected_cash, expected_card, counted_cash, counted_card, diff_cash, diff_card, diff_total) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [locationId, userId, day, expectedCash, expectedCard, counted_cash, counted_card, diffCash, diffCard, diffTotal]
    )

    res.json({
      ok: true,
      data: {
        closure: closureResult.rows[0],
        expected: { cash: expectedCash, card: expectedCard },
        counted: { cash: counted_cash, card: counted_card },
        diff: { cash: diffCash, card: diffCard, total: diffTotal },
      },
      email: { sent: false },
    })
  } catch (error) {
    console.error('Close error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router