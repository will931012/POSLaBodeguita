const express = require('express')
const { query } = require('../config/database')

const router = express.Router()

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
  }
  next()
}

// Apply admin middleware to all routes
router.use(requireAdmin)

// ============================================
// GET /api/analytics/sales-by-category
// ============================================
router.get('/sales-by-category', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const locationId = req.location.id

    let sql = `
      SELECT 
        COALESCE(p.category, 'Sin Categoría') as category,
        COUNT(DISTINCT s.id) as total_sales,
        SUM(si.qty) as total_units,
        SUM(si.qty * si.price) as total_revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE (s.location_id = $1 OR s.location_id IS NULL)
    `
    const params = [locationId]

    if (startDate) {
      sql += ` AND s.created_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += ` GROUP BY p.category ORDER BY total_revenue DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Sales by category error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/analytics/perfume-sales
// ============================================
router.get('/perfume-sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const locationId = req.location.id

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.upc,
        p.category,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.qty) as units_sold,
        SUM(si.qty * si.price) as revenue,
        AVG(si.price) as avg_price,
        p.qty as current_stock
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE (s.location_id = $1 OR s.location_id IS NULL)
        AND (p.category ILIKE '%perfume%' OR p.category ILIKE '%fragancia%')
    `
    const params = [locationId]

    if (startDate) {
      sql += ` AND s.created_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += ` 
      GROUP BY p.id, p.name, p.upc, p.category, p.qty
      ORDER BY revenue DESC
    `

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Perfume sales error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/analytics/sales-timeline
// ============================================
router.get('/sales-timeline', async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query
    const locationId = req.location.id

    let sql = `
      SELECT 
        DATE(s.created_at) as date,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.qty) as units_sold,
        SUM(si.qty * si.price) as revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE (s.location_id = $1 OR s.location_id IS NULL)
    `
    const params = [locationId]

    if (category) {
      sql += ` AND p.category ILIKE $${params.length + 1}`
      params.push(`%${category}%`)
    }

    if (startDate) {
      sql += ` AND s.created_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += ` 
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Sales timeline error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/analytics/top-products
// ============================================
router.get('/top-products', async (req, res) => {
  try {
    const { limit = 10, category } = req.query
    const locationId = req.location.id

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.qty as current_stock,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.qty) as units_sold,
        SUM(si.qty * si.price) as revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE (s.location_id = $1 OR s.location_id IS NULL)
    `
    const params = [locationId]

    if (category) {
      sql += ` AND p.category ILIKE $${params.length + 1}`
      params.push(`%${category}%`)
    }

    sql += ` 
      GROUP BY p.id, p.name, p.category, p.price, p.qty
      ORDER BY revenue DESC
      LIMIT $${params.length + 1}
    `
    params.push(limit)

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Top products error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/analytics/dashboard-summary
// ============================================
router.get('/dashboard-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const locationId = req.location?.id

    console.log('📊 Dashboard Summary Request:', {
      locationId,
      startDate,
      endDate,
      user: req.user,
      location: req.location
    })

    if (!locationId) {
      return res.status(400).json({ error: 'Location ID not found' })
    }

    let dateFilter = ''
    const params = [locationId]

    if (startDate && endDate) {
      dateFilter = ` AND s.created_at BETWEEN $2 AND $3`
      params.push(startDate, endDate)
    }

    // Total sales
    const totalSalesQuery = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue
      FROM sales 
      WHERE (location_id = $1 OR location_id IS NULL)
      ${startDate && endDate ? ' AND created_at BETWEEN $2 AND $3' : ''}
    `

    // Perfume sales
    const perfumeSalesQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as perfume_sales,
        COALESCE(SUM(si.qty * si.price), 0) as perfume_revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE (s.location_id = $1 OR s.location_id IS NULL)
        AND (p.category ILIKE '%perfume%' OR p.category ILIKE '%fragancia%')
      ${dateFilter}
    `

    // Categories count
    const categoriesQuery = `
      SELECT COUNT(DISTINCT category) as total_categories
      FROM products
      WHERE category IS NOT NULL
        AND (location_id = $1 OR location_id IS NULL)
    `

    console.log('🔍 Executing queries...')

    const [totalSales, perfumeSales, categories] = await Promise.all([
      query(totalSalesQuery, params).catch(err => {
        console.error('❌ Total sales query error:', err)
        throw err
      }),
      query(perfumeSalesQuery, params).catch(err => {
        console.error('❌ Perfume sales query error:', err)
        throw err
      }),
      query(categoriesQuery, [locationId]).catch(err => {
        console.error('❌ Categories query error:', err)
        throw err
      })
    ])

    console.log('✅ Queries successful:', {
      totalSales: totalSales.rows[0],
      perfumeSales: perfumeSales.rows[0],
      categories: categories.rows[0]
    })

    res.json({
      totalSales: parseInt(totalSales.rows[0]?.total_sales) || 0,
      totalRevenue: parseFloat(totalSales.rows[0]?.total_revenue) || 0,
      perfumeSales: parseInt(perfumeSales.rows[0]?.perfume_sales) || 0,
      perfumeRevenue: parseFloat(perfumeSales.rows[0]?.perfume_revenue) || 0,
      totalCategories: parseInt(categories.rows[0]?.total_categories) || 0
    })
  } catch (error) {
    console.error('❌ Dashboard summary error:', error)
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

module.exports = router
