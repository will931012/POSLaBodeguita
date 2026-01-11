const express = require('express')
const { query } = require('../config/database')
const router = express.Router()

// GET /api/receipts
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 500)
    const result = await query(
      `SELECT id, sale_id, supplier, notes, created_at 
       FROM receipts 
       WHERE location_id = $1
       ORDER BY created_at DESC 
       LIMIT $2`,
      [req.location.id, limit]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/receipts/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query(
      'SELECT * FROM receipts WHERE id = $1 AND location_id = $2',
      [id, req.location.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/receipts
router.post('/', async (req, res) => {
  try {
    const { sale_id, supplier, notes, content } = req.body
    const result = await query(
      `INSERT INTO receipts (sale_id, supplier, notes, content, location_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sale_id || null, supplier || null, notes || null, content || null, req.location.id]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/receipts/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query(
      'DELETE FROM receipts WHERE id = $1 AND location_id = $2',
      [id, req.location.id]
    )
    res.json({ deleted: result.rowCount })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router