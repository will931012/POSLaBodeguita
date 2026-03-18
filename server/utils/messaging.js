const twilio = require('twilio')

function normalizeSmsPhone(phone) {
  if (!phone || !phone.trim()) return null
  const cleaned = phone.replace(/[^\d+]/g, '').trim()
  if (!cleaned) return null

  if (cleaned.startsWith('+')) {
    return cleaned
  }

  if (/^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}`
  }

  if (/^1\d{10}$/.test(cleaned)) {
    return `+${cleaned}`
  }

  return cleaned
}

function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID
    && process.env.TWILIO_AUTH_TOKEN
    && process.env.TWILIO_PHONE_NUMBER
  )
}

function getClient() {
  if (!isSmsConfigured()) {
    return null
  }

  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

async function sendSms({ to, body }) {
  const client = getClient()
  if (!client) {
    throw new Error('Twilio SMS no esta configurado')
  }

  const normalizedTo = normalizeSmsPhone(to)
  if (!normalizedTo) {
    throw new Error('Telefono invalido para SMS')
  }

  return client.messages.create({
    body,
    to: normalizedTo,
    from: process.env.TWILIO_PHONE_NUMBER,
  })
}

module.exports = {
  isSmsConfigured,
  sendSms,
}
