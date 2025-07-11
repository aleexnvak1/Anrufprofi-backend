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

    const htmlContent = `
      <div style="font-family:'Plus Jakarta Sans', sans-serif; color:#333; max-width:600px; margin:0 auto;">
        <div style="background-color:#007aff; padding:24px; text-align:center; color:white; border-radius:10px 10px 0 0;">
          <h2 style="margin:0;">🎉 Danke für deine Anfrage!</h2>
        </div>
        <div style="padding:24px; background-color:#ffffff; border:1px solid #eee;">
          <p>Hallo ${name},</p>
          <p>vielen Dank für deine Nachricht:</p>
          <blockquote style="margin: 10px 0; padding: 10px; background-color: #f8f8f8; border-left: 4px solid #18CB96;">
            ${message}
          </blockquote>
          <p>Unser Team meldet sich <strong>innerhalb von 24 Stunden</strong> bei dir.</p>
          <p style="margin-top:20px;">
            <a href="https://www.anrufprofi.de#demo" style="display:inline-block; padding:12px 20px; background-color:#18CB96; color:white; text-decoration:none; border-radius:8px;">
              📅 Jetzt Demo buchen
            </a>
          </p>
          <p>Viele Grüße<br><strong>Klara</strong> – deine KI-Assistentin 🤖</p>
        </div>
        <div style="padding:16px; background:#f7f7f7; text-align:center;">
          <table style="margin:auto; text-align:left;">
            <tr>
              <td style="padding-right:15px;">
                <img src="https://anrufprofi-backend.onrender.com/Fotos/signatur.png" alt="Klara" width="100" style="border-radius:12px;">
              </td>
              <td>
                <strong style="font-size:16px; color:#007aff;">Klara | KI-Assistentin</strong><br>
                <span style="font-size:14px;">anrufprofi.de – Dein Telefonservice für Handwerksbetriebe</span><br><br>
                📧 <a href="mailto:klara@anrufprofi.de" style="color:#18CB96;">klara@anrufprofi.de</a><br>
                🌐 <a href="https://www.anrufprofi.de" style="color:#18CB96;">www.anrufprofi.de</a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: 'klara@anrufprofi.de',
      to: email,
      subject: 'Vielen Dank für deine Anfrage bei Anrufprofi.de',
      html: htmlContent
    });

    res.status(200).json({ success: true, message: 'Anfrage gespeichert & E-Mail versendet' });

  } catch (err) {
    console.error('❌ Allgemeiner Fehler:', err);
    res.status(500).json({ success: false, error: 'Serverfehler beim Verarbeiten der Anfrage.' });
  }
});

module.exports = router;
