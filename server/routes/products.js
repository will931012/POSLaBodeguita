const express = require('express')
const { query } = require('../config/database')

const router = express.Router()

// ============================================
// GET /api/products - List all products with filters
// ============================================
router.get('/', async (req, res) => {
  try {
    const { q, limit = 50, offset = 0, low } = req.query
    const locationId = req.location.id

    let sql = `
      SELECT * FROM products 
      WHERE (location_id = $1 OR location_id IS NULL)
    `
    const params = [locationId]

    if (q) {
      sql += ` AND (name ILIKE $${params.length + 1} OR upc ILIKE $${params.length + 1} OR category ILIKE $${params.length + 1})`
      params.push(`%${q}%`)
    }

    if (low === '1') {
      sql += ` AND qty < 5`
    }

    const countResult = await query(sql, params)
    const total = countResult.rows.length

    sql += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(sql, params)

    res.json({
      rows: result.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/products - Create product
// ============================================
router.post('/', async (req, res) => {
  try {
    const { upc, name, price, qty, category, shared } = req.body
    
    // TODOS los productos son compartidos por defecto
    // location_id = NULL significa que todas las ubicaciones lo ven
    const locationId = null
    
    const result = await query(
      `INSERT INTO products (upc, name, price, qty, category, location_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [upc || null, name, price, qty, category || null, locationId]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Product create error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// PUT /api/products/:id - Update product
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { upc, name, price, qty, category } = req.body

    const result = await query(
      `UPDATE products 
       SET upc = $1, name = $2, price = $3, qty = $4, category = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [upc || null, name, price, qty, category || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Product update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// DELETE /api/products/:id - Delete product
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Product delete error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router