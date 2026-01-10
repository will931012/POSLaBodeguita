const express = require('express')

module.exports = function(db) {
  const router = express.Router()

  router.get('/close', (req, res) => {
    const day = req.query.day || new Date().toISOString().slice(0, 10)
    const start = `${day} 00:00:00`
    const end = `${day} 23:59:59`

    const total = db.prepare(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM sales
      WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)
    `).get(start, end).total

    const byMethod = {}
    const rows = db.prepare(`
      SELECT payment_method, COALESCE(SUM(total), 0) AS amt
      FROM sales
      WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)
      GROUP BY payment_method
    `).all(start, end)

    rows.forEach(r => {
      const key = (r.payment_method || 'other').toLowerCase()
      byMethod[key] = (byMethod[key] || 0) + (r.amt || 0)
    })

    const salesCount = db.prepare(`
      SELECT COUNT(*) AS n
      FROM sales
      WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)
    `).get(start, end).n

    res.json({ ok: true, data: { day, total, byMethod, salesCount } })
  })

  return router
}
