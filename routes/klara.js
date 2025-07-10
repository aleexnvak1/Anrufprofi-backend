const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');
const { OpenAI } = require('openai');
require('dotenv').config();

// ✅ OpenAI-Instanz initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ POST /api/klara
router.post('/', async (req, res) => {
  const { client_id, message } = req.body;

  if (!client_id || !message) {
    return res.status(400).json({ error: '❌ client_id und message sind erforderlich' });
  }

  // ✅ Kundendaten aus Supabase holen
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    console.error('❌ Supabase Fehler:', clientError?.message);
    return res.status(404).json({ error: '❌ Kunde nicht gefunden' });
  }

  // ✅ Prompt für GPT erzeugen
  const prompt = `
Du bist eine professionelle KI-Bürokraft namens "${client.ai_name}" für das Unternehmen "${client.company_name}".
Begrüße die Kunden mit: "${client.greeting_text}"
Deine Anweisungen lauten: ${client.ai_instructions}

Ein Kunde sagt: "${message}"
Wie würdest du antworten?
`;

  try {
    // ✅ Anfrage an OpenAI senden
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // alternativ: gpt-3.5-turbo
      messages: [{ role: 'user', content: prompt }]
    });

    const reply = response.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('❌ Leere Antwort von OpenAI erhalten');
    }

    res.status(200).json({ reply });
  } catch (err) {
    // ✅ Fehler vollständig loggen
    console.error('❌ Fehler bei OpenAI:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    res.status(500).json({
      error: '❌ Fehler bei der KI-Antwort',
      details: err.message || 'Unbekannter Fehler'
    });
  }
});

module.exports = router;
