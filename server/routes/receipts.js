const express = require('express')

module.exports = function(db) {
  const router = express.Router()

  router.get('/', (req, res) => {
    const rows = db.prepare(`
      SELECT id, sale_id, supplier, notes, created_at
      FROM receipts
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `).all()
    res.json(rows)
  })

  router.post('/', (req, res) => {
    const { sale_id, supplier, notes, content } = req.body
    const info = db.prepare(`
      INSERT INTO receipts (sale_id, supplier, notes, content)
      VALUES (?, ?, ?, ?)
    `).run(sale_id || null, supplier || null, notes || null, content || null)
    
    const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(info.lastInsertRowid)
    res.status(201).json(row)
  })

  return router
}
