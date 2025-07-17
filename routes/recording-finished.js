const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const supabase = require('../supabaseclient');

// Download-Helper
async function downloadRecording(url, filename) {
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  const filepath = path.join('/tmp', filename);
  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filepath));
    writer.on('error', reject);
  });
}

// Whisper-Transkription
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

router.post('/recording-finished', async (req, res) => {
  try {
    console.log('🎤 Recording finished:', req.body);

    const recordingUrl = req.body.recordingUrl || req.body.recordingUrlMp3;
    if (!recordingUrl) {
      console.error('Keine Aufnahme-URL im Webhook gefunden.');
      return res.status(400).send('No recordingUrl found.');
    }

    // Audio herunterladen und transkribieren
    const filename = `call_${Date.now()}.mp3`;
    const filePath = await downloadRecording(recordingUrl, filename);
    const text = await transcribeWithWhisper(filePath);

    // Nummern auslesen (prüfe, wie sie in deinem Webhook wirklich heißen!)
    const from_number = req.body.from || req.body.caller || '';
    const to_number = req.body.to || req.body.called || '';

    // In Supabase speichern
    const { error } = await supabase
      .from('calls')
      .insert([
        {
          from_number,
          to_number,
          recording_url: recordingUrl,
          transcript: text,
          timestamp: new Date().toISOString()
        }
      ]);
    if (error) {
      console.error('Fehler beim Speichern in Supabase:', error);
    } else {
      console.log('Anruf + Transkript in DB gespeichert');
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Fehler bei Aufnahme/Transkription:', err);
    res.status(500).send('Error');
  }
});

module.exports = router;
