require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { initDatabase } = require('./utils/init-db')

const app = express()

// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================
app.use(helmet())

// CORS configurado para producción
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (process.env.ENABLE_LOGGING === 'true') {
  app.use(morgan('combined'))
}

// Rate limiting
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  })
  app.use('/api/', limiter)
}

// ============================================
// ROUTES
// ============================================
app.use('/api/products', require('./routes/products'))
app.use('/api/sales', require('./routes/sales'))
app.use('/api/receipts', require('./routes/receipts'))
app.use('/api/import', require('./routes/import'))
app.use('/report', require('./routes/reports'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'postgresql',
  })
})

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'POS Compassion & Love API',
    version: '2.0.0',
    database: 'PostgreSQL',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      sales: '/api/sales',
      receipts: '/api/receipts',
      import: '/api/import',
      reports: '/report',
    }
  })
})

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
  })
})

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err)
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000
const HOST = '0.0.0.0'

async function startServer() {
  try {
    // Initialize database
    await initDatabase()
    
    // Start server
    app.listen(PORT, HOST, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 POS API Server Running                       ║
║                                                   ║
║   Environment: ${process.env.NODE_ENV?.padEnd(34) || 'development'.padEnd(34)}║
║   Port:        ${PORT.toString().padEnd(34)}║
║   Database:    PostgreSQL                         ║
║   URL:         http://${HOST}:${PORT.toString().padEnd(25)}║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

module.exports = app
