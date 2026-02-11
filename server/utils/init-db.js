const { query } = require('../config/database')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function initDatabase() {
  console.log('🔧 Initializing PostgreSQL database...')

  const maxAttempts = 8
  let attempt = 0

  while (attempt < maxAttempts) {
    try {
      attempt += 1
      if (attempt > 1) {
        console.log(`⏳ Waiting for database... attempt ${attempt}/${maxAttempts}`)
      }

    // Products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        upc VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        qty INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Products table ready')

    // Sales table
    await query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20),
        cash_received DECIMAL(10, 2),
        change_due DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Sales table ready')

    // Sale items table
    await query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        qty INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Sale items table ready')

    // Receipts table
    await query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        supplier VARCHAR(255),
        notes TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Receipts table ready')

    // Closures table
    await query(`
      CREATE TABLE IF NOT EXISTS closures (
        id SERIAL PRIMARY KEY,
        day DATE NOT NULL,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        by_method JSONB NOT NULL,
        counted_cash DECIMAL(10, 2) NOT NULL DEFAULT 0,
        counted_card DECIMAL(10, 2) NOT NULL DEFAULT 0,
        diff_cash DECIMAL(10, 2) NOT NULL DEFAULT 0,
        diff_card DECIMAL(10, 2) NOT NULL DEFAULT 0,
        diff_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Closures table ready')

    // Announcements table
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Announcements table ready')

    // Announcement reads table
    await query(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        id SERIAL PRIMARY KEY,
        announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (announcement_id, user_id)
      )
    `)
    console.log('✅ Announcement reads table ready')

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
      CREATE INDEX IF NOT EXISTS idx_closures_day ON closures(day);
      CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
      CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
    `)
    console.log('✅ Indexes created')

    // Seed initial data if empty
    const { rows } = await query('SELECT COUNT(*) FROM products')
    const count = parseInt(rows[0].count)

    if (count === 0) {
      console.log('🌱 Seeding initial data...')
      
      await query(`
        INSERT INTO products (upc, name, price, qty) VALUES
        ('012345678905', 'Blue Pen', 1.25, 100),
        ('012345678912', 'Notebook A5', 4.99, 50),
        ('012345678929', 'Stapler', 7.50, 20),
        ('012345678936', 'Pencil Set', 2.99, 75),
        ('012345678943', 'Eraser Pack', 1.50, 150)
      `)
      
      console.log('✅ Sample products added')
    }

    console.log('🎉 Database initialized successfully!')
    return true
    } catch (error) {
      const shouldRetry = attempt < maxAttempts
      const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt - 1))
      console.error('❌ Database initialization failed:', error.message)

      if (!shouldRetry) {
        throw error
      }

      console.log(`⏳ Retrying in ${Math.round(delayMs / 1000)}s...`)
      await sleep(delayMs)
    }
  }
}

module.exports = { initDatabase }
