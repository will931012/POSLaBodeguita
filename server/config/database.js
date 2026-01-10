const { Pool } = require("pg");

// =====================
// PostgreSQL Pool Setup
// =====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Railway & managed PostgreSQL always require SSL
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,

  max: 20,                     // Max pool size
  idleTimeoutMillis: 30000,    // Close idle clients after 30s
  connectionTimeoutMillis: 5000, // Safer for Railway cold starts
});

// =====================
// Pool Event Listeners
// =====================
pool.on("connect", () => {
  if (process.env.ENABLE_LOGGING === "true") {
    console.log("✅ PostgreSQL client connected");
  }
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
});

// =====================
// Query Helper
// =====================
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.ENABLE_LOGGING === "true") {
      console.log("🗄️ Query executed", {
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }

    return res;
  } catch (error) {
    console.error("❌ Query error:", {
      text,
      message: error.message,
    });
    throw error;
  }
}

// =====================
// Transaction Helper
// =====================
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =====================
// Raw Client Helper
// =====================
async function getClient() {
  return await pool.connect();
}

module.exports = {
  query,
  transaction,
  getClient,
  pool,
};
