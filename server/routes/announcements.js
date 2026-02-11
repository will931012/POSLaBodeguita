const express = require('express')
const { query } = require('../config/database')
const { requireRole } = require('./auth')

const router = express.Router()

// ============================================
// GET /api/announcements/active - Latest active announcement for user
// ============================================
router.get('/active', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const result = await query(
      `
      SELECT a.id, a.title, a.message, a.created_at
      FROM announcements a
      LEFT JOIN announcement_reads r
        ON r.announcement_id = a.id AND r.user_id = $1
      WHERE a.active = true AND r.id IS NULL
      ORDER BY a.created_at DESC
      LIMIT 1
      `,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(204).send()
    }

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/announcements - Create announcement (admin only)
// ============================================
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { title, message } = req.body || {}

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    const cleanTitle = title && title.trim() ? title.trim() : 'Aviso importante'
    const cleanMessage = message.trim()

    const result = await query(
      `
      INSERT INTO announcements (title, message, created_by)
      VALUES ($1, $2, $3)
      RETURNING id, title, message, created_at
      `,
      [cleanTitle, cleanMessage, req.user.id]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/announcements/:id/dismiss - Dismiss announcement for user
// ============================================
router.post('/:id/dismiss', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const announcementId = parseInt(req.params.id)
    if (!Number.isFinite(announcementId)) {
      return res.status(400).json({ error: 'Invalid announcement id' })
    }

    await query(
      `
      INSERT INTO announcement_reads (announcement_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (announcement_id, user_id) DO NOTHING
      `,
      [announcementId, userId]
    )

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
