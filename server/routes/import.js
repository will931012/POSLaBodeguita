const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')
const { query, transaction } = require('../config/database')

const upload = multer({ storage: multer.memoryStorage() })
const router = express.Router()

// POST /api/import/products
router.post('/products', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    let rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false })
    if (rows.length === 0) return res.status(400).json({ error: 'Empty file' })

    const dryRun = req.query.dryRun === '1'

    const result = await transaction(async (client) => {
      let inserted = 0, updated = 0, skipped = 0

      for (const row of rows) {
        const upc = String(row.upc || row.UPC || '').trim()
        const name = String(row.name || row.Name || row.NAME || '').trim()
        const price = parseFloat(row.price || row.Price || row.PRICE || 0)
        const qty = parseInt(row.qty || row.Qty || row.QTY || 0)

        if (!upc || !name || !isFinite(price) || !Number.isInteger(qty)) {
          skipped++
          continue
        }

        if (dryRun) {
          const checkResult = await client.query(
            'SELECT id FROM products WHERE upc = $1 AND (location_id = $2 OR location_id IS NULL)',
            [upc, req.location.id]
          )
          if (checkResult.rows.length > 0) updated++
          else inserted++
        } else {
          const upsertResult = await client.query(
            `INSERT INTO products (upc, name, price, qty, location_id) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (upc) DO UPDATE 
             SET name = EXCLUDED.name, 
                 price = EXCLUDED.price, 
                 qty = EXCLUDED.qty, 
                 updated_at = CURRENT_TIMESTAMP
             RETURNING (xmax = 0) AS inserted`,
            [upc, name, price, qty, req.location.id]
          )
          if (upsertResult.rows[0].inserted) inserted++
          else updated++
        }
      }

      return { inserted, updated, skipped }
    })

    res.json({ 
      ok: true, 
      dryRun, 
      sheet: wb.SheetNames[0], 
      totalRows: rows.length, 
      location: req.location.name,
      ...result 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router