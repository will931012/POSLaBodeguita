const express = require('express')
const crypto = require('crypto')
const { query } = require('../config/database')

const router = express.Router()

// ============================================
// MIDDLEWARE: Verify Token
// ============================================
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.slice(7)

  try {
    const result = await query(
      `
      SELECT 
        s.*,
        u.id   AS user_id,
        u.name,
        u.role,
        u.location_id AS user_location_id,
        l.id   AS location_id,
        l.name AS location_name
      FROM sessions s
      JOIN users u     ON u.id = s.user_id
      JOIN locations l ON l.id = s.location_id
      WHERE s.token = $1 AND s.active = true
      `,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const row = result.rows[0]

    req.session = row
    req.user = {
      id: row.user_id,
      name: row.name,
      role: row.role,
      location_id: row.user_location_id,
    }
    req.location = {
      id: row.location_id,
      name: row.location_name,
    }

    next()
  } catch (err) {
    console.error('Token verification error:', err)
    res.status(500).json({ error: 'Token verification failed' })
  }
}

// ============================================
// MIDDLEWARE: Require Role
// ============================================
function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles]

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/locations
router.get('/locations', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, slug, address, phone
       FROM locations
       WHERE active = true
       ORDER BY name`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users
router.get('/users', async (req, res) => {
  try {
    const { location_id } = req.query

    const result = location_id
      ? await query(
          `
          SELECT id, name, role
          FROM users
          WHERE active = true
            AND (location_id = $1 OR location_id IS NULL)
          ORDER BY role, name
          `,
          [location_id]
        )
      : await query(
          `
          SELECT id, name, role, location_id
          FROM users
          WHERE active = true
          ORDER BY role, name
          `
        )

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// AUTH ROUTES
// ============================================

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { user_id, pin, location_id } = req.body

    const userResult = await query(
      `SELECT * FROM users WHERE id = $1 AND active = true`,
      [user_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    const user = userResult.rows[0]

    if (user.pin !== pin) {
      return res.status(401).json({ error: 'PIN incorrecto' })
    }

    if (user.role !== 'admin' && user.location_id !== Number(location_id)) {
      return res.status(403).json({ error: 'No tienes acceso a esta ubicación' })
    }

    const token = crypto.randomBytes(32).toString('hex')

    await query(
      `INSERT INTO sessions (user_id, location_id, token)
       VALUES ($1, $2, $3)`,
      [user_id, location_id, token]
    )

    const locationResult = await query(
      `SELECT * FROM locations WHERE id = $1`,
      [location_id]
    )

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      location: locationResult.rows[0],
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// POST /api/auth/logout
router.post('/auth/logout', verifyToken, async (req, res) => {
  try {
    await query(
      `
      UPDATE sessions
      SET active = false, logged_out_at = CURRENT_TIMESTAMP
      WHERE token = $1
      `,
      [req.headers.authorization.slice(7)]
    )

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/auth/me', verifyToken, (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    location: req.location,
    session: {
      logged_in_at: req.session.logged_in_at,
    },
  })
})

// ============================================
// EXPORTS (🔥 CLAVE 🔥)
// ============================================
module.exports = {
  authRouter: router,
  verifyToken,
  requireRole,
}
