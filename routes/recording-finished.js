const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Hilfsfunktion: Audio herunterladen
async function downloadRecording(url, filename) {
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  const filepath = path.join('/tmp', filename); // /tmp funktioniert bei Render
  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filepath));
    writer.on('error', reject);
  });
}

// Hilfsfunktion: OpenAI Whisper Transkription
async function transcribeWithWhisper(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  return response.data.text;
}

// Die Route!
router.post('/recording-finished', async (req, res) => {
  try {
    console.log('🎤 Recording finished:', req.body);

    const recordingUrl = req.body.recordingUrl || req.body.recordingUrlMp3;
    if (!recordingUrl) {
      console.error('Keine Aufnahme-URL im Webhook gefunden.');
      return res.status(400).send('No recordingUrl found.');
    }

    // 1. Aufnahme herunterladen
    const filename = `call_${Date.now()}.mp3`;
    const filePath = await downloadRecording(recordingUrl, filename);
    console.log('Aufnahme gespeichert unter:', filePath);

    // 2. Mit OpenAI Whisper transkribieren
    const text = await transcribeWithWhisper(filePath);
    console.log('Transkribierter Text:', text);

    // 3. (Optional) Ergebnis in Datenbank, E-Mail, KI, etc.

    res.status(200).send('OK');
  } catch (err) {
    console.error('Fehler bei Aufnahme/Transkription:', err);
    res.status(500).send('Error');
  }
});

module.exports = router;
