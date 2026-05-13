export const DEFAULT_PRODUCT_CATEGORIES = [
  'Sublimation Products',
]

export function mergeProductCategories(categories = []) {
  const uniqueCategories = new Set(DEFAULT_PRODUCT_CATEGORIES)

  categories.forEach((category) => {
    const normalizedCategory = String(category || '').trim()
    if (normalizedCategory) {
      uniqueCategories.add(normalizedCategory)
    }
  })

  return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b))
}
