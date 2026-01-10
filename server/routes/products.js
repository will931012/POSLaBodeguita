const express = require('express')
const { query } = require('../config/database')

const router = express.Router()

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50'), 1), 200)
    const offset = Math.max(parseInt(req.query.offset || '0'), 0)
    const q = (req.query.q || '').trim()
    const low = req.query.low === '1'

    let whereClauses = []
    let params = []
    let paramIndex = 1

    if (q) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR upc ILIKE $${paramIndex})`)
      params.push(`%${q}%`)
      paramIndex++
    }

    if (low) {
      whereClauses.push('qty < 5')
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countResult = await query(`SELECT COUNT(*) as total FROM products ${whereSQL}`, params)
    const total = parseInt(countResult.rows[0].total)

    params.push(limit, offset)
    const result = await query(
      `SELECT * FROM products ${whereSQL} ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    res.json({ rows: result.rows, total, limit, offset })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid ID' })
    }

    const result = await query('SELECT * FROM products WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { upc, name, price = 0, qty = 0 } = req.body

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await query(
      `INSERT INTO products (upc, name, price, qty) VALUES ($1, $2, $3, $4) RETURNING *`,
      [upc || null, String(name).trim(), Number(price), Number(qty)]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'UPC already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { upc, name, price, qty } = req.body

    const checkResult = await query('SELECT * FROM products WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const current = checkResult.rows[0]

    const result = await query(
      `UPDATE products SET upc = $1, name = $2, price = $3, qty = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`,
      [
        typeof upc === 'undefined' ? current.upc : upc,
        (typeof name === 'undefined' ? current.name : name).toString().trim(),
        Number(typeof price === 'undefined' ? current.price : price),
        Number(typeof qty === 'undefined' ? current.qty : qty),
        id,
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'UPC already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query('DELETE FROM products WHERE id = $1', [id])
    res.json({ deleted: result.rowCount })
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete product. It is referenced in sales.' })
    }
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
