const express = require('express')
const { query, transaction } = require('../config/database')
const router = express.Router()

router.get('/today', async (req, res) => {
  try {
    const result = await query(`
      SELECT EXTRACT(HOUR FROM created_at)::text AS hour, SUM(total) AS total
      FROM sales WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY hour ORDER BY hour
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { items = [], payment = {}, override_total } = req.body

    const result = await transaction(async (client) => {
      let computed = 0
      for (const item of items) {
        const { product_id, qty } = item
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [product_id])
        if (productResult.rows.length === 0) throw new Error(`Product ${product_id} not found`)
        const product = productResult.rows[0]
        if (product.qty < qty) throw new Error(`Insufficient stock for ${product.name}`)
        computed += parseFloat(product.price) * qty
      }

      const finalTotal = override_total !== undefined ? Number(override_total) : computed

      const saleResult = await client.query(
        `INSERT INTO sales (total, payment_method, cash_received, change_due) VALUES ($1, $2, $3, $4) RETURNING *`,
        [finalTotal, payment.method || null, payment.method === 'cash' ? Number(payment.cash_received || 0) : null, payment.method === 'cash' ? Number(payment.change_due || 0) : 0]
      )

      const sale = saleResult.rows[0]
      const saleItems = []

      for (const item of items) {
        const { product_id, qty } = item
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [product_id])
        const product = productResult.rows[0]
        await client.query('UPDATE products SET qty = qty - $1 WHERE id = $2', [qty, product_id])
        const itemResult = await client.query(
          `INSERT INTO sale_items (sale_id, product_id, qty, price) VALUES ($1, $2, $3, $4) RETURNING *`,
          [sale.id, product_id, qty, product.price]
        )
        saleItems.push({ ...itemResult.rows[0], name: product.name, subtotal: parseFloat(product.price) * qty })
      }

      return { ...sale, items: saleItems }
    })

    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
