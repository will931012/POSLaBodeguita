const express = require('express')
const { query, transaction } = require('../config/database')
const router = express.Router()

// En GET /api/sales/today
router.get('/today', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at)::text AS hour,
        SUM(total) AS total
      FROM sales
      WHERE DATE(created_at) = CURRENT_DATE
        AND location_id = $1
      GROUP BY hour
      ORDER BY hour
    `, [req.location.id])

    res.json(result.rows)
  } catch (error) {
    console.error('Sales today error:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.id, s.total, s.payment_method, s.cash_received, s.change_due, s.created_at,
        json_agg(
          json_build_object(
            'name', COALESCE(p.name, 'Producto temporal'),
            'qty', si.qty,
            'price', si.price
          ) ORDER BY si.id
        ) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE DATE(s.created_at) = CURRENT_DATE
        AND s.location_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `, [req.location.id])

    res.json(result.rows)
  } catch (error) {
    console.error('Sales list error:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { items = [], payment = {}, override_total } = req.body

    console.log('🛒 === CREANDO VENTA ===')
    console.log('Location ID:', req.location.id)
    console.log('User ID:', req.user.id)
    console.log('Items:', items.length)
    console.log('Override total:', override_total)

    const result = await transaction(async (client) => {
      let computed = 0
      for (const item of items) {
        const { product_id, qty } = item
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [product_id])
        if (productResult.rows.length === 0) {
          throw new Error(`Product ${product_id} not found`)
        }
        const product = productResult.rows[0]
        
        // ❌ ELIMINADO: Validación de stock
        // if (product.qty < qty) throw new Error(`Insufficient stock for ${product.name}`)
        
        computed += parseFloat(product.price) * qty
      }

      const finalTotal = override_total !== undefined ? Number(override_total) : computed

      console.log('💰 Total calculado:', computed)
      console.log('💰 Total final:', finalTotal)

      const saleResult = await client.query(
        `INSERT INTO sales (total, payment_method, cash_received, change_due, location_id, user_id, session_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          finalTotal,
          payment.method || null,
          payment.method === 'cash' ? Number(payment.cash_received || 0) : null,
          payment.method === 'cash' ? Number(payment.change_due || 0) : 0,
          req.location.id,
          req.user.id,
          req.session.id,
        ]
      )

      const sale = saleResult.rows[0]
      console.log('✅ Venta creada con ID:', sale.id)

      const saleItems = []

      for (const item of items) {
        const { product_id, qty } = item
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [product_id])
        const product = productResult.rows[0]
        
        // Actualizar stock (puede quedar negativo)
        await client.query('UPDATE products SET qty = qty - $1 WHERE id = $2', [qty, product_id])
        console.log(`  📦 ${product.name}: ${product.qty} → ${product.qty - qty}`)
        
        const itemResult = await client.query(
          `INSERT INTO sale_items (sale_id, product_id, qty, price) VALUES ($1, $2, $3, $4) RETURNING *`,
          [sale.id, product_id, qty, product.price]
        )
        saleItems.push({ ...itemResult.rows[0], name: product.name, subtotal: parseFloat(product.price) * qty })
      }

      console.log('✅ Sale items guardados:', saleItems.length)

      return { ...sale, items: saleItems }
    })

    console.log('✅ Transacción completada exitosamente')
    console.log('📋 Sale ID devuelto al frontend:', result.id)
    
    res.status(201).json(result)
  } catch (error) {
    console.error('❌ Error creando venta:', error)
    res.status(400).json({ error: error.message })
  }
})

module.exports = router