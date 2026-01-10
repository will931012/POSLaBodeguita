#!/usr/bin/env node

/**
 * Migración SOLO PRODUCTS
 * SQLite → PostgreSQL
 * Versión FINAL (Railway safe + varchar safe)
 */

require('dotenv').config()
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { Client } = require('pg')

// ===============================
// CONFIG
// ===============================
const SQLITE_DB_PATH = path.resolve(__dirname, 'pos.db')
const BATCH_SIZE = 100
const MAX_NAME_LENGTH = 255

// ===============================
// VALIDACIONES
// ===============================
console.log('📂 SQLite DB:', SQLITE_DB_PATH)

if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error('❌ SQLite DB not found')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

// ===============================
// MIGRATION
// ===============================
async function migrateProducts() {
  console.log('\n🚀 Migrating PRODUCTS only (safe mode)...\n')

  const sqlite = new Database(SQLITE_DB_PATH, {
    readonly: true,
    fileMustExist: true,
  })

  const products = sqlite
    .prepare('SELECT id, upc, name, price, qty FROM products')
    .all()

  console.log(`📦 Products found: ${products.length}`)

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 0,
    query_timeout: 0,
    connectionTimeoutMillis: 60000,
  })

  await client.connect()
  console.log('✅ Connected to PostgreSQL')

  try {
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)

      await client.query('BEGIN')

      const values = []
      const placeholders = batch.map((p, idx) => {
        const base = idx * 5

        const safeName =
          typeof p.name === 'string'
            ? p.name.slice(0, MAX_NAME_LENGTH)
            : ''

        values.push(
          p.id,
          p.upc,
          safeName,
          Number(p.price) || 0,
          Number(p.qty) || 0
        )

        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
      })

      const sql = `
        INSERT INTO products (id, upc, name, price, qty)
        VALUES ${placeholders.join(',')}
        ON CONFLICT (id) DO UPDATE SET
          upc = EXCLUDED.upc,
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          qty = EXCLUDED.qty
      `

      await client.query(sql, values)
      await client.query('COMMIT')

      console.log(
        `✅ Inserted ${Math.min(i + BATCH_SIZE, products.length)} / ${products.length}`
      )
    }

    await client.query(`
      SELECT setval(
        'products_id_seq',
        (SELECT MAX(id) FROM products)
      )
    `)

    console.log('\n🎉 PRODUCTS migration completed successfully!')
  } catch (err) {
    console.error('\n❌ Migration failed:', err)
    try {
      await client.query('ROLLBACK')
    } catch {}
    process.exit(1)
  } finally {
    await client.end()
    sqlite.close()
    console.log('🔒 Connections closed')
  }
}

// ===============================
migrateProducts()
