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
      secure: false,
      auth: {
        user: 'klara@anrufprofi.de',
        pass: process.env.KLARA_EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: 'klara@anrufprofi.de',
      to: email,
      subject: 'Vielen Dank für deine Anfrage bei Anrufprofi.de',
      text: `Hallo ${name},\n\nvielen Dank für deine Nachricht:\n\n"${message}"\n\nWir melden uns schnellstmöglich zurück!\n\n– Dein anrufprofi.de Team`,
      html: `
        <p>Hallo ${name},</p>
        <p>vielen Dank für deine Nachricht:</p>
        <blockquote style="margin: 10px 0; padding: 10px; background-color: #f8f8f8; border-left: 4px solid #18CB96;">
          ${message}
        </blockquote>
        <p>Wir melden uns schnellstmöglich zurück!</p>
        <br>
        <hr style="border:1px solid #ddd;">
        <table style="font-family:'Plus Jakarta Sans', sans-serif; color:#333; margin-top:15px;">
          <tr>
            <td style="padding-right:15px;">
              <img src="https://anrufprofi-backend.onrender.com/Fotos/signatur.png.svg
" alt="Klara" width="80" style="border-radius:12px;">
            </td>
            <td>
              <strong style="font-size:16px; color:#007aff;">Klara | KI-Assistentin</strong><br>
              <span style="font-size:14px;">anrufprofi.de – Ihr 24/7 Telefonservice für Handwerksbetriebe</span><br><br>
              📧 <a href="mailto:klara@anrufprofi.de" style="color:#18CB96;">klara@anrufprofi.de</a><br>
              🌐 <a href="https://www.anrufprofi.de" style="color:#18CB96;">www.anrufprofi.de</a>
            </td>
          </tr>
        </table>
      `
    });

    res.status(200).json({ success: true, message: 'Anfrage gespeichert & E-Mail versendet' });

  } catch (err) {
    console.error('❌ Allgemeiner Fehler:', err);
    res.status(500).json({ success: false, error: 'Serverfehler beim Verarbeiten der Anfrage.' });
  }
});

module.exports = router;
