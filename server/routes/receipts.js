const express = require('express')
const { query } = require('../config/database')

const router = express.Router()

// ============================================
// GET /api/receipts - List receipts
// ============================================
router.get('/', async (req, res) => {
  try {
    const locationId = req.location.id

    const result = await query(
      `SELECT * FROM receipts 
       WHERE location_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [locationId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Receipts fetch error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/receipts/:id - Get receipt
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const locationId = req.location.id

    const result = await query(
      'SELECT * FROM receipts WHERE id = $1 AND location_id = $2',
      [id, locationId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Receipt fetch error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/receipts - Create receipt
// ============================================
router.post('/', async (req, res) => {
  try {
    const { sale_id, content, supplier, notes } = req.body
    const locationId = req.location.id

    const result = await query(
      `INSERT INTO receipts (location_id, sale_id, content, supplier, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [locationId, sale_id || null, content || null, supplier || null, notes || null]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Receipt create error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// DELETE /api/receipts/:id - Delete receipt
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const locationId = req.location.id

    const result = await query(
      'DELETE FROM receipts WHERE id = $1 AND location_id = $2 RETURNING *',
      [id, locationId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' })
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Receipt delete error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router