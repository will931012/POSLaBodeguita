const express = require('express')
const multer = require('multer')
const csv = require('csv-parser')
const { Readable } = require('stream')
const { query } = require('../config/database')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// ============================================
// POST /api/import/products - Import CSV
// ============================================
router.post('/products', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const dryRun = req.query.dryRun === '1'
    const locationId = req.location.id

    const results = []
    const errors = []

    const stream = Readable.from(req.file.buffer.toString())

    stream
      .pipe(csv())
      .on('data', (row) => {
        results.push(row)
      })
      .on('end', async () => {
        if (!dryRun) {
          for (const row of results) {
            try {
              await query(
                `INSERT INTO products (upc, name, price, qty, location_id) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [row.upc || null, row.name, parseFloat(row.price), parseInt(row.qty), locationId]
              )
            } catch (error) {
              errors.push({ row, error: error.message })
            }
          }
        }

        res.json({
          ok: true,
          imported: results.length - errors.length,
          errors: errors.length,
          dryRun,
          preview: results.slice(0, 5),
        })
      })
      .on('error', (error) => {
        res.status(500).json({ error: error.message })
      })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router