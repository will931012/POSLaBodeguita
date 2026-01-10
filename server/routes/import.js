const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')

const upload = multer({ storage: multer.memoryStorage() })

module.exports = function(db) {
  const router = express.Router()

  router.post('/products', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    try {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      let rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false })

      const dryRun = req.query.dryRun === '1'

      const tx = db.transaction((rows) => {
        let inserted = 0, updated = 0, skipped = 0

        rows.forEach(row => {
          const upc = String(row.upc || row.UPC || '').trim()
          const name = String(row.name || row.Name || row.NAME || '').trim()
          const price = Number(row.price || row.Price || row.PRICE || 0)
          const qty = parseInt(row.qty || row.Qty || row.QTY || 0, 10)

          if (!upc || !name || !isFinite(price) || !Number.isInteger(qty)) {
            skipped++
            return
          }

          const exists = db.prepare('SELECT id FROM products WHERE upc = ?').get(upc)

          if (!dryRun) {
            db.prepare(`
              INSERT INTO products (upc, name, price, qty)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(upc) DO UPDATE SET
                name = excluded.name,
                price = excluded.price,
                qty = excluded.qty,
                updated_at = datetime('now')
            `).run(upc, name, price, qty)
          }

          if (exists) updated++
          else inserted++
        })

        return { inserted, updated, skipped }
      })

      const result = tx(rows)
      res.json({
        ok: true,
        dryRun,
        sheet: wb.SheetNames[0],
        totalRows: rows.length,
        ...result
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}
