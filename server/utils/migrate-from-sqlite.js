#!/usr/bin/env node

/**
 * Script para migrar datos de SQLite a PostgreSQL
 * 
 * Uso:
 * 1. Asegúrate de tener tu archivo pos.db en la misma carpeta
 * 2. Configura DATABASE_URL en .env apuntando a PostgreSQL
 * 3. Ejecuta: node utils/migrate-from-sqlite.js
 */

require('dotenv').config()
const Database = require('better-sqlite3')
const { query, transaction } = require('../config/database')

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './pos.db'

async function migrate() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...\n')

  try {
    // Connect to SQLite
    console.log('📂 Opening SQLite database:', SQLITE_DB_PATH)
    const sqlite = new Database(SQLITE_DB_PATH, { readonly: true })

    // Migrate Products
    console.log('\n📦 Migrating products...')
    const products = sqlite.prepare('SELECT * FROM products').all()
    console.log(`Found ${products.length} products`)

    for (const product of products) {
      await query(
        `INSERT INTO products (id, upc, name, price, qty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, CURRENT_TIMESTAMP), COALESCE($7::timestamp, CURRENT_TIMESTAMP))
         ON CONFLICT (id) DO UPDATE SET
           upc = EXCLUDED.upc,
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           qty = EXCLUDED.qty`,
        [
          product.id,
          product.upc,
          product.name,
          product.price,
          product.qty,
          product.created_at,
          product.updated_at,
        ]
      )
    }
    
    // Update sequence
    await query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`)
    console.log('✅ Products migrated')

    // Migrate Sales
    console.log('\n💰 Migrating sales...')
    const sales = sqlite.prepare('SELECT * FROM sales').all()
    console.log(`Found ${sales.length} sales`)

    for (const sale of sales) {
      await query(
        `INSERT INTO sales (id, total, payment_method, cash_received, change_due, created_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, CURRENT_TIMESTAMP))
         ON CONFLICT (id) DO NOTHING`,
        [
          sale.id,
          sale.total,
          sale.payment_method,
          sale.cash_received,
          sale.change_due,
          sale.created_at,
        ]
      )
    }
    
    await query(`SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales))`)
    console.log('✅ Sales migrated')

    // Migrate Sale Items
    console.log('\n🛒 Migrating sale items...')
    const saleItems = sqlite.prepare('SELECT * FROM sale_items').all()
    console.log(`Found ${saleItems.length} sale items`)

    for (const item of saleItems) {
      await query(
        `INSERT INTO sale_items (id, sale_id, product_id, qty, price)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.sale_id, item.product_id, item.qty, item.price]
      )
    }
    
    await query(`SELECT setval('sale_items_id_seq', (SELECT MAX(id) FROM sale_items))`)
    console.log('✅ Sale items migrated')

    // Migrate Receipts
    console.log('\n🧾 Migrating receipts...')
    const receipts = sqlite.prepare('SELECT * FROM receipts').all()
    console.log(`Found ${receipts.length} receipts`)

    for (const receipt of receipts) {
      await query(
        `INSERT INTO receipts (id, sale_id, supplier, notes, content, created_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, CURRENT_TIMESTAMP))
         ON CONFLICT (id) DO NOTHING`,
        [
          receipt.id,
          receipt.sale_id,
          receipt.supplier,
          receipt.notes,
          receipt.content,
          receipt.created_at,
        ]
      )
    }
    
    await query(`SELECT setval('receipts_id_seq', (SELECT MAX(id) FROM receipts))`)
    console.log('✅ Receipts migrated')

    // Migrate Closures (if table exists)
    try {
      console.log('\n💼 Migrating closures...')
      const closures = sqlite.prepare('SELECT * FROM closures').all()
      console.log(`Found ${closures.length} closures`)

      for (const closure of closures) {
        await query(
          `INSERT INTO closures (id, day, total, by_method, counted_cash, counted_card, diff_cash, diff_card, diff_total, created_at)
           VALUES ($1, $2::date, $3, $4::jsonb, $5, $6, $7, $8, $9, COALESCE($10::timestamp, CURRENT_TIMESTAMP))
           ON CONFLICT (id) DO NOTHING`,
          [
            closure.id,
            closure.day,
            closure.total,
            closure.by_method,
            closure.counted_cash || 0,
            closure.counted_card || 0,
            closure.diff_cash || 0,
            closure.diff_card || 0,
            closure.diff_total || 0,
            closure.created_at,
          ]
        )
      }
      
      await query(`SELECT setval('closures_id_seq', (SELECT MAX(id) FROM closures))`)
      console.log('✅ Closures migrated')
    } catch (error) {
      console.log('⚠️  Closures table not found or error:', error.message)
    }

    // Close SQLite
    sqlite.close()

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    const counts = await query(`
      SELECT 
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM sales) as sales,
        (SELECT COUNT(*) FROM sale_items) as sale_items,
        (SELECT COUNT(*) FROM receipts) as receipts,
        (SELECT COUNT(*) FROM closures) as closures
    `)
    
    console.log('\n📊 Migration Summary:')
    console.log('  Products:', counts.rows[0].products)
    console.log('  Sales:', counts.rows[0].sales)
    console.log('  Sale Items:', counts.rows[0].sale_items)
    console.log('  Receipts:', counts.rows[0].receipts)
    console.log('  Closures:', counts.rows[0].closures)

    console.log('\n✅ Migration completed successfully!')
    console.log('\n⚠️  IMPORTANT: Make a backup of your SQLite database before deleting it!')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrate()
