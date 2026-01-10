const express = require('express')
const { query } = require('../config/database')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 500)
    const result = await query(
      `SELECT id, sale_id, supplier, notes, created_at FROM receipts ORDER BY created_at DESC LIMIT $1`,
      [limit]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query('SELECT * FROM receipts WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { sale_id, supplier, notes, content } = req.body
    const result = await query(
      `INSERT INTO receipts (sale_id, supplier, notes, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [sale_id || null, supplier || null, notes || null, content || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query('DELETE FROM receipts WHERE id = $1', [id])
    res.json({ deleted: result.rowCount })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
