const express = require('express')
const { query, transaction } = require('../config/database')

const router = express.Router()

// GET /api/sales/today - Sales by hour for today
router.get('/today', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at)::text AS hour,
        SUM(total) AS total
      FROM sales
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY hour
      ORDER BY hour
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Get today sales error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/sales - List all sales
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 500)
    const offset = Math.max(parseInt(req.query.offset || '0'), 0)

    const result = await query(
      `SELECT * FROM sales 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Get sales error:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/sales - Create new sale
router.post('/', async (req, res) => {
  try {
    const { items = [], payment = {}, override_total } = req.body

    if (!Array.isArray(items) || (items.length === 0 && override_total === undefined)) {
      return res.status(400).json({ 
        error: 'items[] required unless override_total is provided' 
      })
    }

    const result = await transaction(async (client) => {
      let computed = 0

      // Validate stock and calculate total
      for (const item of items) {
        const { product_id, qty } = item

        const productResult = await client.query(
          'SELECT * FROM products WHERE id = $1',
          [product_id]
        )

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${product_id} not found`)
        }

        const product = productResult.rows[0]

        if (product.qty < qty) {
          throw new Error(`Insufficient stock for ${product.name}`)
        }

        computed += parseFloat(product.price) * qty
      }

      const finalTotal = override_total !== undefined ? Number(override_total) : computed

      // Create sale
      const saleResult = await client.query(
        `INSERT INTO sales (total, payment_method, cash_received, change_due)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          finalTotal,
          payment.method || null,
          payment.method === 'cash' ? Number(payment.cash_received || 0) : null,
          payment.method === 'cash' ? Number(payment.change_due || 0) : 0,
        ]
      )

      const sale = saleResult.rows[0]
      const saleId = sale.id

      // Create sale items and update inventory
      const saleItems = []
      for (const item of items) {
        const { product_id, qty } = item

        // Get product details
        const productResult = await client.query(
          'SELECT * FROM products WHERE id = $1',
          [product_id]
        )
        const product = productResult.rows[0]

        // Update inventory
        await client.query(
          'UPDATE products SET qty = qty - $1 WHERE id = $2',
          [qty, product_id]
        )

        // Create sale item
        const itemResult = await client.query(
          `INSERT INTO sale_items (sale_id, product_id, qty, price)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [saleId, product_id, qty, product.price]
        )

        saleItems.push({
          ...itemResult.rows[0],
          name: product.name,
          subtotal: parseFloat(product.price) * qty,
        })
      }

      return {
        ...sale,
        items: saleItems,
      }
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('Create sale error:', error)
    res.status(400).json({ error: error.message })
  }
})

// GET /api/sales/:id - Get sale with items
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    const saleResult = await query('SELECT * FROM sales WHERE id = $1', [id])
    
    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    const sale = saleResult.rows[0]

    const itemsResult = await query(
      `SELECT si.*, p.name, (si.qty * si.price) AS subtotal
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = $1
       ORDER BY si.id`,
      [id]
    )

    res.json({
      ...sale,
      items: itemsResult.rows,
    })
  } catch (error) {
    console.error('Get sale error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
