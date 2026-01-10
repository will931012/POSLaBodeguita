#!/usr/bin/env node

/**
 * Importar PRODUCTS desde SQLite a PostgreSQL
 * ❌ NO inserta duplicados por UPC
 * ✅ Seguro para múltiples imports
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
  console.log('\n🚀 Importing PRODUCTS (no duplicate UPCs)...\n')

  const sqlite = new Database(SQLITE_DB_PATH, {
    readonly: true,
    fileMustExist: true,
  })

  const products = sqlite
    .prepare('SELECT id, upc, name, price, qty FROM products')
    .all()

  console.log(`📦 Products found in SQLite: ${products.length}`)

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 0,
    query_timeout: 0,
    connectionTimeoutMillis: 60000,
  })

  await client.connect()
  console.log('✅ Connected to PostgreSQL')

  let inserted = 0

  try {
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)

      await client.query('BEGIN')

      const values = []
      const placeholders = batch
        .filter(p => p.upc) // ⚠️ solo productos con UPC
        .map((p, idx) => {
          const base = idx * 4

          values.push(
            p.upc,
            (p.name || '').slice(0, MAX_NAME_LENGTH),
            Number(p.price) || 0,
            Number(p.qty) || 0
          )

          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
        })

      if (placeholders.length === 0) {
        await client.query('ROLLBACK')
        continue
      }

      const sql = `
        INSERT INTO products (upc, name, price, qty)
        VALUES ${placeholders.join(',')}
        ON CONFLICT (upc) DO NOTHING
      `

      const res = await client.query(sql, values)
      await client.query('COMMIT')

      inserted += res.rowCount

      console.log(`✅ Inserted ${inserted} new products`)
    }

    console.log('\n🎉 Import completed successfully!')
    console.log(`🧾 Total new products inserted: ${inserted}`)
  } catch (err) {
    console.error('\n❌ Import failed:', err)
    try { await client.query('ROLLBACK') } catch {}
    process.exit(1)
  } finally {
    await client.end()
    sqlite.close()
    console.log('🔒 Connections closed')
  }
}

// ===============================
migrateProducts()
