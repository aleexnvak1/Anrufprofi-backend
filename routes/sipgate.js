const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Hilfsfunktion: Aufnahme herunterladen
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

// Haupt-Route für alle sipgate.io-Events
router.post('/incoming-call', async (req, res) => {
  // Event-Type auslesen (Sipgate schickt alles an diese Route)
  const event = req.body.event || req.body.eventType || '';

  console.log('Sipgate Event:', event, req.body);

  // 1. INCOMING_CALL: Begrüßung, Call Control (TTS + Aufnahme)
  if (event === 'INCOMING_CALL') {
    res.set('Content-Type', 'application/xml');
    res.send(`
      <Response>
        <Say language="de-DE" voice="female">
          Hallo! Sie sprechen mit Klara, der virtuellen Assistentin von anrufprofi.de. Bitte schildern Sie Ihr Anliegen nach dem Signalton.
        </Say>
        <Record maxDuration="60" />
        <Say>Danke für Ihre Nachricht. Wir melden uns schnellstmöglich bei Ihnen zurück. Auf Wiederhören!</Say>
        <Hangup />
      </Response>
    `);
    return;
  }

  // 2. RECORDING_FINISHED: Aufnahme downloaden, transkribieren, speichern
  if (event === 'RECORDING_FINISHED') {
    try {
      const recordingUrl = req.body.recordingUrl || req.body.recordingUrlMp3;
      if (!recordingUrl) {
        console.error('Keine Aufnahme-URL im Webhook gefunden.');
        return res.status(400).send('No recordingUrl found.');
      }

      // Audio herunterladen und transkribieren
      const filename = `call_${Date.now()}.mp3`;
      const filePath = await downloadRecording(recordingUrl, filename);
      const text = await transcribeWithWhisper(filePath);

      // Nummern auslesen (je nach Sipgate-Webhook)
      const from_number = req.body.from || req.body.caller || '';
      const to_number = req.body.to || req.body.called || '';

      // In die Supabase DB speichern
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
    return;
  }

  // Für andere Events einfach mit OK antworten
  res.status(200).send('OK');
});

module.exports = router;
