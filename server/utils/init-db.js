const { query } = require("../config/database");

async function initDatabase() {
  console.log("🔧 Initializing PostgreSQL database schema...");

  try {
    /* =====================
       PRODUCTS
    ===================== */
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        upc VARCHAR(100) UNIQUE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        qty INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Products table ready");

    /* =====================
       SALES
    ===================== */
    await query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20),
        cash_received DECIMAL(10,2),
        change_due DECIMAL(10,2),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Sales table ready");

    /* =====================
       SALE ITEMS
    ===================== */
    await query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        qty INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Sale items table ready");

    /* =====================
       RECEIPTS
    ===================== */
    await query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        supplier VARCHAR(255),
        notes TEXT,
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Receipts table ready");

    /* =====================
       CLOSURES
    ===================== */
    await query(`
      CREATE TABLE IF NOT EXISTS closures (
        id SERIAL PRIMARY KEY,
        day DATE NOT NULL,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        by_method JSONB NOT NULL,
        counted_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
        counted_card DECIMAL(10,2) NOT NULL DEFAULT 0,
        diff_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
        diff_card DECIMAL(10,2) NOT NULL DEFAULT 0,
        diff_total DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Closures table ready");

    /* =====================
       INDEXES (one by one)
    ===================== */
    await query(`CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_closures_day ON closures(day);`);

    console.log("✅ Indexes ready");

    /* =====================
       UPDATED_AT TRIGGER
    ===================== */
    await query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at'
        ) THEN
          CREATE TRIGGER trg_products_updated_at
          BEFORE UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
      END;
      $$;
    `);

    /* =====================
       SEED DATA
    ===================== */
    const { rows } = await query("SELECT COUNT(*)::int AS count FROM products");
    const count = rows[0].count;

    if (count === 0) {
      console.log("🌱 Seeding initial data...");

      await query(`
        INSERT INTO products (upc, name, price, qty) VALUES
        ('012345678905', 'Blue Pen', 1.25, 100),
        ('012345678912', 'Notebook A5', 4.99, 50),
        ('012345678929', 'Stapler', 7.50, 20),
        ('012345678936', 'Pencil Set', 2.99, 75),
        ('012345678943', 'Eraser Pack', 1.50, 150);
      `);

      console.log("✅ Initial data seeded");
    }

    console.log("🎉 Database initialization complete!");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

module.exports = { initDatabase };
