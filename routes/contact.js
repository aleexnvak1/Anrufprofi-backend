const express = require('express');
const nodemailer = require('nodemailer');
const supabase = require('../supabaseclient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  console.log('📨 Neue Anfrage erhalten:', { name, email, message });

  try {
    // 1. In Supabase speichern
    const { error } = await supabase
      .from('contact_requests')
      .insert([{ name, email, message, status: 'offen' }]);

    if (error) {
      console.error('❌ Fehler beim Speichern in Supabase:', error);
      return res.status(500).json({ success: false, error: 'Fehler beim Speichern der Nachricht.' });
    }

    // 2. E-Mail über IONOS versenden
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.de',
      port: 587,
      secure: false, // TLS über STARTTLS
      auth: {
        user: 'klara@anrufprofi.de',
        pass: process.env.KLARA_EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: 'klara@anrufprofi.de',
      to: email,
      subject: 'Vielen Dank für deine Anfrage bei anrufprofi.de',
      text: `Hallo ${name},\n\nvielen Dank für deine Nachricht:\n\n"${message}"\n\nWir melden uns schnellstmöglich zurück!\n\n– Dein anrufprofi.de Team`,
    });

    res.status(200).json({ success: true, message: 'Anfrage gespeichert & E-Mail versendet' });

  } catch (err) {
    console.error('❌ Allgemeiner Fehler:', err);
    res.status(500).json({ success: false, error: 'Serverfehler beim Verarbeiten der Anfrage.' });
  }
});

module.exports = router;
