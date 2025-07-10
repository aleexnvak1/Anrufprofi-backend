const express = require('express')
const nodemailer = require('nodemailer')
const supabase = require('../supabaseclient')

const router = express.Router()

router.post('/', async (req, res) => {
  const { name, email, message } = req.body

  console.log('📨 Neue Anfrage erhalten:')
  console.log('Name:', name)
  console.log('E-Mail:', email)
  console.log('Nachricht:', message)

  // 1. In Supabase speichern
  try {
    const { data, error } = await supabase
      .from('contact_requests')
.insert([{ name, email, message, status: 'offen' }])

    if (error) {
      console.error('❌ Fehler beim Speichern in Supabase:', error)
    } else {
      console.log('✅ Anfrage gespeichert in Supabase:', data)
    }
  } catch (err) {
    console.error('❌ Unerwarteter Fehler bei Supabase:', err)
  }
  if (error) {
  console.error('Supabase Error:', error)
  return res.status(500).json({ error: 'Fehler beim Speichern der Nachricht.' })
}


  // 2. Bestätigungs-Mail senden
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Vielen Dank für deine Anfrage bei anrufprofi.de',
      text: `Hallo ${name},\n\nvielen Dank für deine Nachricht:\n\n"${message}"\n\nWir melden uns schnellstmöglich zurück!\n\n– Dein anrufprofi.de Team`,
    })

    res.status(200).json({ success: true, message: 'Anfrage gespeichert & E-Mail versendet' })
  } catch (err) {
    console.error('❌ Fehler bei OpenAI:', err.response?.status, err.response?.data || err.message);
    return res.status(500).json({
      error: 'Fehler bei der KI-Antwort',
      detail: err.response?.data || err.message
    });
  }
})

module.exports = router
