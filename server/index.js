require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { initDatabase } = require('./utils/init-db')
const { router: authRouter, verifyToken, requireRole } = require('./routes/auth')

const app = express()

// ============================================
// SECURITY & MIDDLEWARE
// ============================================
app.use(helmet())

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (process.env.ENABLE_LOGGING === 'true') {
  app.use(morgan('combined'))
}

if (process.env.ENABLE_RATE_LIMITING === 'true') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
  app.use('/api/', limiter)
}

// ============================================
// ROUTES
// ============================================

// Auth routes (PUBLIC - no verifyToken needed)
app.use('/api', authRouter)

// Import route modules
const productsRouter = require('./routes/products')
const salesRouter = require('./routes/sales')
const receiptsRouter = require('./routes/receipts')
const reportsRouter = require('./routes/reports')
const importRouter = require('./routes/import')

// Protected routes (require authentication)
app.use('/api/products', verifyToken, productsRouter)
app.use('/api/sales', verifyToken, salesRouter)
app.use('/api/receipts', verifyToken, receiptsRouter)
app.use('/report', verifyToken, reportsRouter)

// Admin/Manager only routes
app.use('/api/import', verifyToken, requireRole(['admin', 'manager']), importRouter)

// Health check (PUBLIC)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'postgresql',
  })
})

// Root (PUBLIC)
app.get('/', (req, res) => {
  res.json({
    name: 'POS Multi-Store API',
    version: '2.0.0',
    database: 'PostgreSQL',
    status: 'running',
  })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000
const HOST = '0.0.0.0'

async function startServer() {
  try {
    await initDatabase()
    
    app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════╗
║  🚀 POS Multi-Store API                    ║
║                                            ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║  Port: ${PORT.toString().padEnd(35)}║
║  Database: PostgreSQL                      ║
║                                            ║
║  ✅ Server is ready!                       ║
╚════════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...')
  process.exit(0)
})

module.exports = app