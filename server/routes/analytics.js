const express = require('express')
const { query } = require('../config/database')

const router = express.Router()
const PERFUME_CATEGORY_MATCH = `(p.category ILIKE '%perfume%' OR p.category ILIKE '%fragancia%')`
const SUBLIMATION_CATEGORY_MATCH = `(p.category ILIKE '%sublimation%' OR p.category ILIKE '%sublimacion%')`

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
  }
  next()
}

// Apply admin middleware to all routes
router.use(requireAdmin)

const buildNoFilter = () => ({
  clause: '1=1',
  params: []
})

// ============================================
// GET /api/analytics/sales-by-category
// ============================================
router.get('/sales-by-category', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const { clause, params } = buildNoFilter()

    let sql = `
      SELECT
        COALESCE(p.category, 'Sin Categoria') as category,
        COUNT(DISTINCT s.id) as total_sales,
        SUM(si.qty) as total_units,
        SUM(si.qty * si.price) as total_revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE ${clause}
    `

    if (startDate) {
      sql += ` AND s.created_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += ' GROUP BY p.category ORDER BY total_revenue DESC'

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
    const { clause, params } = buildNoFilter()

    let sql = `
      SELECT
        p.id,
        p.name,
        p.upc,
        p.category,
        p.perfume_size,
        p.fragrance_type,
        p.perfume_condition,
        p.price as list_price,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.qty) as units_sold,
        SUM(si.qty * si.price) as revenue,
        AVG(si.price) as avg_price,
        MAX(si.price) as last_sale_price,
        MAX(s.created_at) as last_sold_at,
        p.qty as current_stock
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE ${clause}
        AND ${PERFUME_CATEGORY_MATCH}
    `

    if (startDate) {
      sql += ` AND s.created_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += `
      GROUP BY
        p.id,
        p.name,
        p.upc,
        p.category,
        p.perfume_size,
        p.fragrance_type,
        p.perfume_condition,
        p.price,
        p.qty
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
// GET /api/analytics/sublimation-sales
// ============================================
router.get('/sublimation-sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const { clause, params } = buildNoFilter()

    let sql = `
      SELECT
        p.id,
        p.name,
        p.upc,
        p.category,
        p.price as list_price,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.qty) as units_sold,
        SUM(si.qty * si.price) as revenue,
        AVG(si.price) as avg_price,
        MAX(si.price) as last_sale_price,
        MAX(s.created_at) as last_sold_at,
        p.qty as current_stock
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE ${clause}
        AND ${SUBLIMATION_CATEGORY_MATCH}
    `

    if (startDate) {
      sql += ` AND s.created_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND s.created_at <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += `
      GROUP BY
        p.id,
        p.name,
        p.upc,
        p.category,
        p.price,
        p.qty
      ORDER BY revenue DESC
    `

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Sublimation sales error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET /api/analytics/sales-timeline
// ============================================
router.get('/sales-timeline', async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query
    const { clause, params } = buildNoFilter()

    let sql = `
      SELECT
        DATE(s.created_at) as date,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.qty) as units_sold,
        SUM(si.qty * si.price) as revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE ${clause}
    `

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
    const { clause, params } = buildNoFilter()

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
      WHERE ${clause}
    `

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
    const salesFilter = buildNoFilter()
    const productFilter = buildNoFilter()

    console.log('Dashboard Summary Request:', {
      startDate,
      endDate,
      user: req.user,
      location: req.location,
      scope: 'all-locations'
    })

    if (startDate && endDate) {
      salesFilter.params.push(startDate, endDate)
    }

    const totalSalesDateFilter = startDate && endDate
      ? ` AND created_at BETWEEN $${salesFilter.params.length - 1} AND $${salesFilter.params.length}`
      : ''

    const perfumeSalesDateFilter = startDate && endDate
      ? ` AND s.created_at BETWEEN $${salesFilter.params.length - 1} AND $${salesFilter.params.length}`
      : ''

    const totalSalesQuery = `
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue
      FROM sales
      WHERE ${salesFilter.clause}
      ${totalSalesDateFilter}
    `

    const perfumeSalesQuery = `
      SELECT
        COUNT(DISTINCT s.id) as perfume_sales,
        COALESCE(SUM(si.qty * si.price), 0) as perfume_revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE ${salesFilter.clause}
        AND ${PERFUME_CATEGORY_MATCH}
      ${perfumeSalesDateFilter}
    `

    const categoriesQuery = `
      SELECT COUNT(DISTINCT category) as total_categories
      FROM products
      WHERE category IS NOT NULL
        AND ${productFilter.clause}
    `

    const [totalSales, perfumeSales, categories] = await Promise.all([
      query(totalSalesQuery, salesFilter.params),
      query(perfumeSalesQuery, salesFilter.params),
      query(categoriesQuery, productFilter.params)
    ])

    res.json({
      totalSales: parseInt(totalSales.rows[0]?.total_sales, 10) || 0,
      totalRevenue: parseFloat(totalSales.rows[0]?.total_revenue) || 0,
      perfumeSales: parseInt(perfumeSales.rows[0]?.perfume_sales, 10) || 0,
      perfumeRevenue: parseFloat(perfumeSales.rows[0]?.perfume_revenue) || 0,
      totalCategories: parseInt(categories.rows[0]?.total_categories, 10) || 0
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// ============================================
// GET /api/analytics/location-breakdown
// ============================================
router.get('/location-breakdown', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const params = []

    let salesDateFilter = ''
    if (startDate) {
      params.push(startDate)
      salesDateFilter += ` AND created_at >= $${params.length}`
    }

    if (endDate) {
      params.push(endDate)
      salesDateFilter += ` AND created_at <= $${params.length}`
    }

    const sql = `
      WITH filtered_sales AS (
        SELECT id, location_id, total
        FROM sales
        WHERE 1=1
        ${salesDateFilter}
      ),
      sales_by_location AS (
        SELECT
          l.id,
          l.name,
          COUNT(fs.id) as total_sales,
          COALESCE(SUM(fs.total), 0) as total_revenue
        FROM locations l
        LEFT JOIN filtered_sales fs ON fs.location_id = l.id
        WHERE l.active = true
        GROUP BY l.id, l.name
      ),
      perfume_by_location AS (
        SELECT
          l.id,
          COUNT(DISTINCT fs.id) FILTER (
            WHERE ${PERFUME_CATEGORY_MATCH}
          ) as perfume_sales,
          COALESCE(SUM(
            CASE
              WHEN ${PERFUME_CATEGORY_MATCH}
              THEN si.qty * si.price
              ELSE 0
            END
          ), 0) as perfume_revenue
        FROM locations l
        LEFT JOIN filtered_sales fs ON fs.location_id = l.id
        LEFT JOIN sale_items si ON si.sale_id = fs.id
        LEFT JOIN products p ON p.id = si.product_id
        WHERE l.active = true
        GROUP BY l.id
      )
      SELECT
        sbl.id as location_id,
        sbl.name as location_name,
        sbl.total_sales,
        sbl.total_revenue,
        COALESCE(pbl.perfume_sales, 0) as perfume_sales,
        COALESCE(pbl.perfume_revenue, 0) as perfume_revenue
      FROM sales_by_location sbl
      LEFT JOIN perfume_by_location pbl ON pbl.id = sbl.id
      ORDER BY sbl.name ASC
    `

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Location breakdown error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
