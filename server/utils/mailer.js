const nodemailer = require('nodemailer')

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS
  )
}

function getTransporter() {
  if (!isMailConfigured()) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter()

  if (!transporter) {
    throw new Error('SMTP no configurado')
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}

module.exports = {
  isMailConfigured,
  sendEmail,
}
