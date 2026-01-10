const express = require('express')

module.exports = function(db) {
  const router = express.Router()

  // GET /api/products - List products with pagination and search
  router.get('/', (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200)
      const offset = Math.max(parseInt(req.query.offset || '0', 10), 0)
      const q = (req.query.q || '').trim()
      const low = req.query.low === '1'

      const where = []
      const params = {}

      if (q) {
        where.push('(name LIKE @s OR upc LIKE @s)')
        params.s = `%${q}%`
      }
      if (low) where.push('(qty < 5)')

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

      const total = db.prepare(`SELECT COUNT(*) AS c FROM products ${whereSql}`).get(params).c
      const rows = db.prepare(`
        SELECT id, upc, name, price, qty, created_at, updated_at
        FROM products
        ${whereSql}
        ORDER BY id DESC
        LIMIT @limit OFFSET @offset
      `).all({ ...params, limit, offset })

      res.json({ rows, total, limit, offset })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // GET /api/products/:id - Get single product
  router.get('/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10)
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID' })
      }

      const row = db.prepare(`
        SELECT id, upc, name, price, qty, created_at, updated_at
        FROM products 
        WHERE id = ?
      `).get(id)

      if (!row) {
        return res.status(404).json({ error: 'Product not found' })
      }

      res.json(row)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // POST /api/products - Create new product
  router.post('/', (req, res) => {
    try {
      const { upc, name, price = 0, qty = 0 } = req.body

      if (!name || String(name).trim() === '') {
        return res.status(400).json({ error: 'Name is required' })
      }

      const info = db.prepare(`
        INSERT INTO products (upc, name, price, qty)
        VALUES (?, ?, ?, ?)
      `).run(upc || null, String(name).trim(), Number(price), Number(qty))

      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid)
      res.status(201).json(row)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  // PUT /api/products/:id - Update product
  router.put('/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10)
      const { upc, name, price, qty } = req.body

      const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
      if (!current) {
        return res.status(404).json({ error: 'Product not found' })
      }

      db.prepare(`
        UPDATE products 
        SET upc = ?, name = ?, price = ?, qty = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        typeof upc === 'undefined' ? current.upc : upc,
        (typeof name === 'undefined' ? current.name : name).toString().trim(),
        Number(typeof price === 'undefined' ? current.price : price),
        Number(typeof qty === 'undefined' ? current.qty : qty),
        id
      )

      const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
      res.json(updated)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  // DELETE /api/products/:id - Delete product
  router.delete('/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10)
      const info = db.prepare('DELETE FROM products WHERE id = ?').run(id)
      res.json({ deleted: info.changes })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
