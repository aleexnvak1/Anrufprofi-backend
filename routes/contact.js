const express = require('express')
const nodemailer = require('nodemailer')
const supabase = require('../supabaseclient')

const router = express.Router()

router.post('/', async (req, res) => {
  const { name, email, message } = req.body

  console.log('📨 Neue Anfrage erhalten:', { name, email, message })

  // 1. In Supabase speichern
  try {
    const { data, error } = await supabase
      .from('contact_requests')
      .insert([{ name, email, message, status: 'offen' }])

    if (error) {
      console.error('❌ Fehler beim Speichern in Supabase:', error)
      return res.status(500).json({ success: false, error: 'Fehler beim Speichern der Nachricht.' })
    }

    console.log('✅ Anfrage gespeichert in Supabase:', data)

    // 2. Bestätigungs-Mail senden
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Vielen Dank für deine Anfrage bei anrufprofi.de',
      text: `Hallo ${name},\n\nvielen Dank für deine Nachricht:\n\n"${message}"\n\nWir melden uns schnellstmöglich zurück!\n\n– Dein anrufprofi.de Team`,
    })

    return res.status(200).json({ success: true, message: 'Anfrage gespeichert & E-Mail versendet' })

  } catch (err) {
    console.error('❌ Allgemeiner Fehler:', err)
    return res.status(500).json({ success: false, error: 'Serverfehler beim Verarbeiten der Anfrage.' })
  }
})

module.exports = router
