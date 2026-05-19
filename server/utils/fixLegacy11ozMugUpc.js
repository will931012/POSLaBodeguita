const { pool, transaction } = require('../config/database')
const { resolveProductUpc } = require('./productUpc')

const LEGACY_UPC = '85469874139565657'

async function fixLegacy11ozMugUpc() {
  const result = await transaction(async (client) => {
    const existingProduct = await client.query(
      `SELECT id, name, upc
       FROM products
       WHERE upc = $1
       LIMIT 1`,
      [LEGACY_UPC]
    )

    if (existingProduct.rows.length === 0) {
      return { updated: false, reason: 'legacy-upc-not-found' }
    }

    const product = existingProduct.rows[0]
    const nextUpc = await resolveProductUpc(client, null)

    const updatedProduct = await client.query(
      `UPDATE products
       SET upc = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, upc`,
      [nextUpc, product.id]
    )

    return {
      updated: true,
      previousUpc: LEGACY_UPC,
      product: updatedProduct.rows[0],
    }
  })

  if (!result.updated) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(JSON.stringify(result, null, 2))
}

fixLegacy11ozMugUpc()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
