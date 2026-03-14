const express = require('express')
const multer = require('multer')
const csv = require('csv-parser')
const { Readable } = require('stream')
const XLSX = require('xlsx')
const { query } = require('../config/database')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const parseCsvBuffer = async (buffer) => {
  const rows = []

  return new Promise((resolve, reject) => {
    Readable.from(buffer.toString())
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    return []
  }

  const sheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  })
}

const getRowsFromFile = async (file) => {
  const fileName = (file.originalname || '').toLowerCase()

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelBuffer(file.buffer)
  }

  return parseCsvBuffer(file.buffer)
}

// ============================================
// POST /api/import/products - Import CSV
// ============================================
router.post('/products', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const dryRun = req.query.dryRun === '1'
    // TODOS los productos importados son compartidos (location_id = NULL)
    const locationId = null

    const errors = []
    const results = await getRowsFromFile(req.file)

    if (!dryRun) {
      for (const row of results) {
        try {
          await query(
            `INSERT INTO products (upc, name, price, qty, category, location_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              row.upc || null,
              row.name,
              parseFloat(row.price),
              parseInt(row.qty),
              row.category || null,
              locationId,
            ]
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
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
