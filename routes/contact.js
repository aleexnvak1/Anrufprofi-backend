const express = require('express');
const nodemailer = require('nodemailer');
const supabase = require('../supabaseclient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  console.log('📨 Neue Anfrage erhalten:', { name, email, phone, message });

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
      <div style="font-family:'Plus Jakarta Sans', sans-serif; color:#333; max-width:600px; margin:0 auto; text-align:center;">

        <div style="background-color:#007aff; padding:20px 30px; color:white; border-radius:10px 10px 0 0;">
          <h2 style="margin:0; font-size:22px;">Vielen Dank für deine Anfrage, ${name}!</h2>
        </div>

        <div style="padding:30px; background-color:#ffffff; border:1px solid #eee; border-top:none;">

          <p style="font-size:16px; margin-bottom:20px;">
            Wir haben deine Nachricht erhalten und melden uns so schnell wie möglich bei dir zurück.
          </p>

          <h3 style="font-size:18px; color:#18CB96; margin-top:30px;">📝 Deine Nachricht:</h3>
          <blockquote style="margin: 20px auto; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #18CB96; text-align:left;">
            ${message}
          </blockquote>

          <p style="font-size:15px; margin-top:30px;">
            Bis bald – dein Team von <strong>anrufprofi.de</strong> 👋
          </p>
        </div>

        <div style="padding:20px 0; background-color:#f7f7f7; border-top:1px solid #eee;">
          <img src="https://anrufprofi-backend.onrender.com/Fotos/signatur.png" alt="Klara Signatur" style="width:auto; max-width:100%; height:auto; display:block; margin:0 auto;">
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
