const AUTO_UPC_START = 1200000001n
const AUTO_UPC_LOCK_KEY = 1200000001

const normalizeProvidedUpc = (value) => {
  if (typeof value !== 'string') return value ?? null

  const trimmed = value.trim()
  return trimmed || null
}

const generateNextUpc = async (client) => {
  await client.query('SELECT pg_advisory_xact_lock($1)', [AUTO_UPC_LOCK_KEY])

  const { rows } = await client.query(
    `SELECT MAX(CAST(upc AS BIGINT)) AS max_upc
     FROM products
     WHERE upc IS NOT NULL
       AND upc ~ '^[0-9]+$'
       AND CAST(upc AS BIGINT) >= $1`,
    [AUTO_UPC_START.toString()]
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
