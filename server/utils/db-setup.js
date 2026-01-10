module.exports = function setupDatabase(db) {
  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      upc   TEXT UNIQUE,
      name  TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      qty   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  `)

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      total          REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      cash_received  REAL,
      change_due     REAL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
  `)

  // Sale items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id    INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty        INTEGER NOT NULL,
      price      REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
    
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
  `)

  // Receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id    INTEGER,
      supplier   TEXT,
      notes      TEXT,
      content    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
  `)

  // Closures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS closures (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      day          TEXT NOT NULL,
      total        REAL NOT NULL DEFAULT 0,
      by_method    TEXT NOT NULL,
      counted_cash REAL NOT NULL DEFAULT 0,
      counted_card REAL NOT NULL DEFAULT 0,
      diff_cash    REAL NOT NULL DEFAULT 0,
      diff_card    REAL NOT NULL DEFAULT 0,
      diff_total   REAL NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_closures_day ON closures(day);
  `)

  // Seed data if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c
  if (count === 0) {
    const seed = db.prepare(`
      INSERT INTO products (upc, name, price, qty) 
      VALUES (?, ?, ?, ?)
    `)
    
    seed.run('012345678905', 'Blue Pen', 1.25, 100)
    seed.run('012345678912', 'Notebook A5', 4.99, 50)
    seed.run('012345678929', 'Stapler', 7.50, 20)
    seed.run('012345678936', 'Pencil Set', 2.99, 75)
    seed.run('012345678943', 'Eraser Pack', 1.50, 150)
    
    console.log('✅ Database seeded with sample products')
  }

  console.log('✅ Database initialized successfully')
}
