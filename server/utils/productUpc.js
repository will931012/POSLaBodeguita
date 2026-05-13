const AUTO_UPC_START = 1200000001n
const AUTO_UPC_LOCK_KEY = 1200000001
const POSTGRES_BIGINT_MAX = '9223372036854775807'

const normalizeProvidedUpc = (value) => {
  if (typeof value !== 'string') return value ?? null

  const trimmed = value.trim()
  return trimmed || null
}

const generateNextUpc = async (client) => {
  await client.query('SELECT pg_advisory_xact_lock($1)', [AUTO_UPC_LOCK_KEY])

  const { rows } = await client.query(
    `SELECT MAX(candidate_upc) AS max_upc
     FROM (
       SELECT CASE
         WHEN upc IS NOT NULL
           AND upc ~ '^[0-9]+$'
           AND (
             LENGTH(upc) < 19
             OR (LENGTH(upc) = 19 AND upc <= $1)
           )
         THEN CAST(upc AS BIGINT)
         ELSE NULL
       END AS candidate_upc
       FROM products
     ) upc_candidates
     WHERE candidate_upc >= $2`,
    [POSTGRES_BIGINT_MAX, AUTO_UPC_START.toString()]
  )

  const currentMax = rows[0]?.max_upc ? BigInt(rows[0].max_upc) : AUTO_UPC_START - 1n
  return (currentMax + 1n).toString()
}

const resolveProductUpc = async (client, providedUpc) => {
  const normalizedUpc = normalizeProvidedUpc(providedUpc)
  if (normalizedUpc) return normalizedUpc

  return generateNextUpc(client)
}

module.exports = {
  AUTO_UPC_START,
  resolveProductUpc,
}
