const { Pool } = require('pg')

// Configuración del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20, // máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ PostgreSQL client connected')
})

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err)
})

// Helper para queries con manejo de errores
async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.ENABLE_LOGGING === 'true') {
      console.log('Query executed', { text, duration, rows: res.rowCount })
    }
    
    return res
  } catch (error) {
    console.error('Query error:', { text, error: error.message })
    throw error
  }
}

// Helper para transacciones
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

// Helper para obtener un cliente del pool
async function getClient() {
  return await pool.connect()
}

module.exports = {
  query,
  transaction,
  getClient,
  pool,
}
