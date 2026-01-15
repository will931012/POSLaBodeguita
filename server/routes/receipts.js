const express = require('express')
const { query } = require('../config/database')

const router = express.Router()

// ============================================
// GET /api/receipts - List receipts
// ============================================
router.get('/', async (req, res) => {
  try {
    const locationId = req.location.id

    const result = await query(
      `SELECT id, sale_id, supplier, notes, created_at 
       FROM receipts 
       WHERE location_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [locationId]
    )

    console.log(`📋 Recibos cargados para location ${locationId}:`, result.rows.length)
    res.json(result.rows)
  } catch (error) {
    console.error('Receipts fetch error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/receipts/:id - Get receipt
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const locationId = req.location.id

    const result = await query(
      'SELECT * FROM receipts WHERE id = $1 AND location_id = $2',
      [id, locationId]
    )

    if (result.rows.length === 0) {
      console.log(`❌ Recibo ${id} no encontrado para location ${locationId}`)
      return res.status(404).json({ error: 'Receipt not found' })
    }

    console.log(`✅ Recibo ${id} encontrado`)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Receipt fetch error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// POST /api/receipts - Create receipt
// ============================================
router.post('/', async (req, res) => {
  try {
    const { sale_id, content, supplier, notes } = req.body
    const locationId = req.location.id

    // LOGGING DETALLADO
    console.log('📋 === CREANDO RECIBO ===')
    console.log('Location ID:', locationId)
    console.log('Sale ID recibido:', sale_id, 'tipo:', typeof sale_id)
    console.log('Supplier:', supplier)
    console.log('Notes:', notes)
    console.log('Content length:', content?.length || 0)
    
    // VALIDACIÓN
    if (!sale_id) {
      console.warn('⚠️ ADVERTENCIA: Recibo sin sale_id para location', locationId)
    }

    const result = await query(
      `INSERT INTO receipts (location_id, sale_id, content, supplier, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [locationId, sale_id || null, content || null, supplier || null, notes || null]
    )

    console.log('✅ Recibo creado:')
    console.log('  - ID:', result.rows[0].id)
    console.log('  - Sale ID:', result.rows[0].sale_id)
    console.log('  - Location ID:', result.rows[0].location_id)

    res.json(result.rows[0])
  } catch (error) {
    console.error('❌ Receipt create error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// DELETE /api/receipts/:id - Delete receipt
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const locationId = req.location.id

    const result = await query(
      'DELETE FROM receipts WHERE id = $1 AND location_id = $2 RETURNING *',
      [id, locationId]
    )

    if (result.rows.length === 0) {
      console.log(`❌ Recibo ${id} no encontrado para eliminar en location ${locationId}`)
      return res.status(404).json({ error: 'Receipt not found' })
    }

    console.log(`🗑️ Recibo ${id} eliminado de location ${locationId}`)
    res.json({ ok: true })
  } catch (error) {
    console.error('Receipt delete error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router