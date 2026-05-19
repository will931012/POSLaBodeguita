const CODE39_PATTERNS = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
}

const NARROW_WIDTH = 2
const WIDE_WIDTH = 5
const BARCODE_HEIGHT = 96
const QUIET_ZONE = 14

function normalizeBarcodeValue(value) {
  return String(value || '').trim().toUpperCase()
}

export function canRenderBarcode(value) {
  const normalizedValue = normalizeBarcodeValue(value)
  if (!normalizedValue) return false

  return normalizedValue.split('').every((char) => CODE39_PATTERNS[char])
}

export function buildBarcodeSvg(value) {
  const normalizedValue = normalizeBarcodeValue(value)
  if (!canRenderBarcode(normalizedValue)) return null

  const encodedValue = `*${normalizedValue}*`
  let cursorX = QUIET_ZONE
  let barsMarkup = ''

  encodedValue.split('').forEach((char, charIndex) => {
    const pattern = CODE39_PATTERNS[char]

    pattern.split('').forEach((token, tokenIndex) => {
      const width = token === 'w' ? WIDE_WIDTH : NARROW_WIDTH
      const isBar = tokenIndex % 2 === 0

      if (isBar) {
        barsMarkup += `<rect x="${cursorX}" y="0" width="${width}" height="${BARCODE_HEIGHT}" fill="#111827" />`
      }

      cursorX += width
    })

    if (charIndex < encodedValue.length - 1) {
      cursorX += NARROW_WIDTH
    }
  })

  const totalWidth = cursorX + QUIET_ZONE

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${BARCODE_HEIGHT}" width="100%" height="100%" role="img" aria-label="Barcode for ${normalizedValue}" preserveAspectRatio="none" style="display:block"><rect width="${totalWidth}" height="${BARCODE_HEIGHT}" fill="#ffffff" />${barsMarkup}</svg>`
}
