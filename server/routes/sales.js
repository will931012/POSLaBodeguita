const express = require('express')

module.exports = function(db) {
  const router = express.Router()

  // GET /api/sales/today
  router.get('/today', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT strftime('%H', created_at) AS hour,
               SUM(total) AS total
        FROM sales
        WHERE date(created_at) = date('now')
        GROUP BY hour
        ORDER BY hour
      `).all()
      res.json(rows)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // POST /api/sales
  router.post('/', (req, res) => {
    const { items = [], payment = {}, override_total } = req.body

    if (!Array.isArray(items) || (items.length === 0 && !override_total)) {
      return res.status(400).json({ error: 'items[] required unless override_total provided' })
    }

    const tx = db.transaction(() => {
      let computed = 0

      items.forEach(({ product_id, qty }) => {
        const p = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id)
        if (!p) throw new Error(`Product ${product_id} not found`)
        if (p.qty < qty) throw new Error(`Insufficient stock for ${p.name}`)
        computed += p.price * qty
      })

      const finalTotal = override_total !== undefined ? Number(override_total) : computed

      const saleInfo = db.prepare(`
        INSERT INTO sales (total, payment_method, cash_received, change_due)
        VALUES (?, ?, ?, ?)
      `).run(
        finalTotal,
        payment.method || null,
        payment.method === 'cash' ? Number(payment.cash_received || 0) : null,
        payment.method === 'cash' ? Number(payment.change_due || 0) : 0
      )

      const saleId = saleInfo.lastInsertRowid

      items.forEach(({ product_id, qty }) => {
        const p = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id)
        db.prepare('UPDATE products SET qty = qty - ? WHERE id = ?').run(qty, product_id)
        db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, qty, price)
          VALUES (?, ?, ?, ?)
        `).run(saleId, product_id, qty, p.price)
      })

      const lines = db.prepare(`
        SELECT si.product_id, p.name, si.qty, si.price, (si.qty * si.price) AS subtotal
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
      `).all(saleId)

      const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId)
      return { ...sale, items: lines }
    })

    try {
      const result = tx()
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  return router
}
