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

  const token = authHeader.substring(7)

  try {
    const result = await query(
      `SELECT s.*, u.id as user_id, u.name, u.role, u.location_id as user_location_id, 
              l.id as location_id, l.name as location_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN locations l ON l.id = s.location_id
       WHERE s.token = $1 AND s.active = true`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.session = result.rows[0]
    req.user = {
      id: result.rows[0].user_id,
      name: result.rows[0].name,
      role: result.rows[0].role,
      user_location_id: result.rows[0].user_location_id,
    }
    req.location = {
      id: result.rows[0].location_id,
      name: result.rows[0].location_name,
    }
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ error: 'Token verification failed' })
  }
}

// ============================================
// MIDDLEWARE: Check Role
// ============================================
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userRoles = Array.isArray(roles) ? roles : [roles]
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// ============================================
// GET /api/locations - List active locations
// ============================================
router.get('/locations', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, slug, address, phone FROM locations WHERE active = true ORDER BY name'
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/users - List users for location
// ============================================
router.get('/users', async (req, res) => {
  try {
    const locationId = req.query.location_id

    let result
    if (locationId) {
      result = await query(
        `SELECT id, name, role FROM users 
         WHERE active = true AND (location_id = $1 OR location_id IS NULL)
         ORDER BY 
           CASE role 
             WHEN 'admin' THEN 1 
             WHEN 'manager' THEN 2 
             WHEN 'cashier' THEN 3 
           END, name`,
        [locationId]
      )
    } else {
      result = await query(
        'SELECT id, name, role, location_id FROM users WHERE active = true ORDER BY role, name'
      )
    }

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/auth/login - Login with PIN
// ============================================
router.post('/auth/login', async (req, res) => {
  try {
    const { user_id, pin, location_id } = req.body

    const userResult = await query(
      'SELECT * FROM users WHERE id = $1 AND active = true',
      [user_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    const user = userResult.rows[0]

    if (user.pin !== pin) {
      return res.status(401).json({ error: 'PIN incorrecto' })
    }

    if (user.role !== 'admin' && user.location_id !== parseInt(location_id)) {
      return res.status(403).json({ error: 'No tienes acceso a esta ubicación' })
    }

    const token = crypto.randomBytes(32).toString('hex')

    await query(
      `INSERT INTO sessions (user_id, location_id, token) VALUES ($1, $2, $3)`,
      [user_id, location_id, token]
    )

    const locationResult = await query(
      'SELECT * FROM locations WHERE id = $1',
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
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// ============================================
// POST /api/auth/logout - Logout
// ============================================
router.post('/auth/logout', verifyToken, async (req, res) => {
  try {
    await query(
      `UPDATE sessions SET active = false, logged_out_at = CURRENT_TIMESTAMP WHERE token = $1`,
      [req.headers.authorization.substring(7)]
    )

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/auth/me - Get current user
// ============================================
router.get('/auth/me', verifyToken, async (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    location: req.location,
    session: {
      logged_in_at: req.session.logged_in_at,
    },
  })
})

module.exports = { router, verifyToken, requireRole }