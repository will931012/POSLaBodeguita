const twilio = require('twilio')

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

  return client.messages.create({
    body,
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
  })
}

module.exports = {
  isSmsConfigured,
  sendSms,
}
