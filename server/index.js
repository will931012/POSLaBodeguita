require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { initDatabase } = require('./utils/init-db')

const app = express()

// ============================================
// SECURITY & MIDDLEWARE
// ============================================
app.use(helmet())

// CORS CONFIGURATION
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, apps móviles)
    if (!origin) return callback(null, true)
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://pos-la-bodeguita-bwq99ra3d-moraima-pineros-projects.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn('❌ CORS blocked origin:', origin)
      // En desarrollo: permitir todos
      callback(null, true)
      // En producción: descomentar la siguiente línea
      // callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
// IMPORT ROUTES WITH ERROR HANDLING
// ============================================
let authRouter, verifyToken, requireRole

try {
  const authModule = require('./routes/auth')
  authRouter = authModule.router
  verifyToken = authModule.verifyToken
  requireRole = authModule.requireRole
  
  if (!authRouter || !verifyToken || !requireRole) {
    throw new Error('auth.js no exporta correctamente')
  }
  console.log('✅ Auth module loaded')
} catch (error) {
  console.error('❌ CRITICAL: No se pudo cargar routes/auth.js')
  console.error('   Error:', error.message)
  console.error('   Asegúrate de que routes/auth.js existe')
  process.exit(1)
}

let productsRouter, salesRouter, receiptsRouter, reportsRouter, importRouter, analyticsRouter

try {
  productsRouter = require('./routes/products')
  salesRouter = require('./routes/sales')
  receiptsRouter = require('./routes/receipts')
  reportsRouter = require('./routes/reports')
  importRouter = require('./routes/import')
  analyticsRouter = require('./routes/analytics')
  console.log('✅ All routes loaded')
} catch (error) {
  console.error('❌ ERROR loading routes:', error.message)
  process.exit(1)
}

// ============================================
// ROUTES
// ============================================

// Auth routes (PUBLIC)
app.use('/api', authRouter)

// Protected routes
app.use('/api/products', verifyToken, productsRouter)
app.use('/api/sales', verifyToken, salesRouter)
app.use('/api/receipts', verifyToken, receiptsRouter)
app.use('/report', verifyToken, reportsRouter)

// Admin/Manager only
app.use('/api/import', verifyToken, requireRole(['admin', 'manager']), importRouter)

// Admin only - Analytics Dashboard
app.use('/api/analytics', verifyToken, analyticsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'postgresql',
  })
})

// Root
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