const express = require('express')
const { query, transaction } = require('../config/database')

const router = express.Router()

// GET /api/products - List products with pagination and search
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

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM products ${whereSQL}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    // Get paginated results
    params.push(limit, offset)
    const result = await query(
      `SELECT id, upc, name, price, qty, created_at, updated_at
       FROM products
       ${whereSQL}
       ORDER BY id DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    res.json({
      rows: result.rows,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid ID' })
    }

    const result = await query(
      'SELECT id, upc, name, price, qty, created_at, updated_at FROM products WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const { upc, name, price = 0, qty = 0 } = req.body

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await query(
      `INSERT INTO products (upc, name, price, qty)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [upc || null, String(name).trim(), Number(price), Number(qty)]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Create product error:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'UPC already exists' })
    }
    
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { upc, name, price, qty } = req.body

    // Check if product exists
    const checkResult = await query('SELECT * FROM products WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const current = checkResult.rows[0]

    const result = await query(
      `UPDATE products 
       SET upc = $1, name = $2, price = $3, qty = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
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
    console.error('Update product error:', error)
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'UPC already exists' })
    }
    
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    const result = await query('DELETE FROM products WHERE id = $1', [id])

    res.json({ deleted: result.rowCount })
  } catch (error) {
    console.error('Delete product error:', error)
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        error: 'Cannot delete product. It is referenced in sales.' 
      })
    }
    
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
