const { Pool } = require('pg')

// Railway provides DATABASE_URL automatically
const pgSslMode = (process.env.PGSSLMODE || '').toLowerCase()
const connectionString = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL
const sslEnabled = pgSslMode === 'require'
  || (pgSslMode !== 'disable' && (process.env.NODE_ENV === 'production' || !!connectionString))

const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err)
})

async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.ENABLE_LOGGING === 'true') {
      console.log('Query:', { text: text.substring(0, 100), duration, rows: res.rowCount })
    }
    
    return res
  } catch (error) {
    console.error('Query error:', error.message)
    throw error
  }
}

async function transaction(callback) {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = { query, transaction, pool }
