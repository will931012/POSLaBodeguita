require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { initDatabase } = require("./utils/init-db");
const { pool } = require("./config/database");

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ============================================
// CORS
// ============================================
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================
// BODY PARSER
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// LOGGING
// ============================================
if (process.env.ENABLE_LOGGING === "true") {
  app.use(morgan("combined"));
}

// ============================================
// RATE LIMITING
// ============================================
if (process.env.ENABLE_RATE_LIMITING === "true") {
  app.use(
    "/api/",
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
      max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

// ============================================
// ROUTES
// ============================================
app.use("/api/products", require("./routes/products"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/receipts", require("./routes/receipts"));
app.use("/api/import", require("./routes/import"));
app.use("/report", require("./routes/reports"));

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "postgresql",
    });
  } catch {
    res.status(503).json({
      ok: false,
      database: "down",
    });
  }
});

// ============================================
// ROOT
// ============================================
app.get("/", (req, res) => {
  res.json({
    name: "POS Compassion & Love API",
    version: "2.0.0",
    database: "PostgreSQL",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      sales: "/api/sales",
      receipts: "/api/receipts",
      import: "/api/import",
      reports: "/report",
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = Number(process.env.PORT || 4000);
const HOST = "0.0.0.0";

async function startServer() {
  // Init DB WITHOUT blocking startup
  initDatabase().catch((err) => {
    console.error("⚠️ Database init failed (server still running):", err);
  });

  app.listen(PORT, HOST, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 POS API Server Running                       ║
║                                                   ║
║   Environment: ${(process.env.NODE_ENV || "dev").padEnd(33)}║
║   Port:        ${PORT.toString().padEnd(33)}║
║   Database:    PostgreSQL                         ║
╚═══════════════════════════════════════════════════╝
    `);
  });
}

startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
async function shutdown(signal) {
  console.log(`⚠️ ${signal} received, shutting down gracefully...`);
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = app;
