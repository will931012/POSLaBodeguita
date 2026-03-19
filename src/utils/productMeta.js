export const PERFUME_CONDITION_OPTIONS = [
  'Original',
  'Tester',
  'Gift Set',
  'Mini',
  'Travel Size',
  'Open Box',
  'Refill',
]

export function isPerfumeCategory(category) {
  const normalized = String(category || '').trim().toLowerCase()
  return normalized.includes('perfume') || normalized.includes('fragancia')
}

export function buildPerfumeDetails(product) {
  return [
    product?.perfume_size,
    product?.fragrance_type,
    product?.perfume_condition,
  ].filter(Boolean)
}
