const DEFAULT_PRODUCT_CATEGORIES = [
  'Sublimation Products',
]

const normalizeCategoryName = (value) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed || null
}

const ensureProductCategory = async (client, category) => {
  const normalizedCategory = normalizeCategoryName(category)
  if (!normalizedCategory) return null

  await client.query(
    `INSERT INTO product_categories (name)
     VALUES ($1)
     ON CONFLICT (name) DO NOTHING`,
    [normalizedCategory]
  )

  return normalizedCategory
}

module.exports = {
  DEFAULT_PRODUCT_CATEGORIES,
  ensureProductCategory,
  normalizeCategoryName,
}
