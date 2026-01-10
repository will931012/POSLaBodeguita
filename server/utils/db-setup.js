/**
 * db-setup.js
 * PostgreSQL schema setup + seed
 */

import pool from "./db.js";

export default async function setupDatabase() {
  try {
    /* =====================
       PRODUCTS
    ===================== */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        upc TEXT UNIQUE,
        name TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        qty INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);

    /* =====================
       SALES
    ===================== */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        total NUMERIC(10,2) NOT NULL DEFAULT 0,
        payment_method TEXT,
        cash_received NUMERIC(10,2),
        change_due NUMERIC(10,2),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);`);

    /* =====================
       SALE ITEMS
    ===================== */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        qty INTEGER NOT NULL,
        price NUMERIC(10,2) NOT NULL
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);`);

    /* =====================
       RECEIPTS
    ===================== */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        supplier TEXT,
        notes TEXT,
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);`);

    /* =====================
       CLOSURES
    ===================== */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS closures (
        id SERIAL PRIMARY KEY,
        day DATE NOT NULL,
        total NUMERIC(10,2) NOT NULL DEFAULT 0,
        by_method JSONB NOT NULL,
        counted_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
        counted_card NUMERIC(10,2) NOT NULL DEFAULT 0,
        diff_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
        diff_card NUMERIC(10,2) NOT NULL DEFAULT 0,
        diff_total NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_closures_day ON closures(day);`);

    /* =====================
       SEED DATA
    ===================== */
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products"
    );

    if (rows[0].count === 0) {
      await pool.query(
        `
        INSERT INTO products (upc, name, price, qty) VALUES
        ($1,$2,$3,$4),
        ($5,$6,$7,$8),
        ($9,$10,$11,$12),
        ($13,$14,$15,$16),
        ($17,$18,$19,$20)
        `,
        [
          "012345678905", "Blue Pen", 1.25, 100,
          "012345678912", "Notebook A5", 4.99, 50,
          "012345678929", "Stapler", 7.50, 20,
          "012345678936", "Pencil Set", 2.99, 75,
          "012345678943", "Eraser Pack", 1.50, 150,
        ]
      );

      console.log("✅ Database seeded with sample products");
    }

    console.log("✅ Database setup completed successfully");
  } catch (err) {
    console.error("❌ Database setup failed:", err);
    throw err;
  }
}
