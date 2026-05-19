export const PERFUME_CONDITION_OPTIONS = [
  'Original',
  'Tester',
  'Gift Set',
  'Mini',
  'Travel Size',
  'Open Box',
  'Refill',
]

const SUBLIMATION_KEYWORDS = ['sublimation', 'sublimacion']
const SUBLIMATION_CATEGORY_NAMES = ['sublimation products', 'sublimation product']

function normalizeCategoryValue(category) {
  return String(category || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function isPerfumeCategory(category) {
  const normalized = normalizeCategoryValue(category)
  return normalized.includes('perfume') || normalized.includes('fragancia')
}

export function isSublimationCategory(category) {
  const normalized = normalizeCategoryValue(category)
  return SUBLIMATION_CATEGORY_NAMES.includes(normalized)
    || SUBLIMATION_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function buildPerfumeDetails(product) {
  return [
    product?.perfume_size,
    product?.fragrance_type,
    product?.perfume_condition,
  ].filter(Boolean)
}
