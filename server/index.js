require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const Database = require('better-sqlite3')

const app = express()

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// ============================================
// DATABASE SETUP
// ============================================
const db = new Database(path.join(__dirname, 'pos.db'))
db.pragma('journal_mode = WAL')

// Create tables
require('./utils/db-setup')(db)

// ============================================
// ROUTES
// ============================================
app.use('/api/products', require('./routes/products')(db))
app.use('/api/sales', require('./routes/sales')(db))
app.use('/api/receipts', require('./routes/receipts')(db))
app.use('/api/import', require('./routes/import')(db))
app.use('/report', require('./routes/reports')(db))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000
const HOST = '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 POS Server Running                   ║
║                                           ║
║   Local:   http://localhost:${PORT}        ║
║   Network: http://0.0.0.0:${PORT}          ║
║                                           ║
╚═══════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database...')
  db.close()
  process.exit(0)
})

module.exports = app
