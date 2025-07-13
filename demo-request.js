// api/demo-requests.js
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient'); // Beachte: Kleinschreibung wie Dateiname!

// Demo-Anfrage speichern
router.post('/', async (req, res) => {
  const { name, company, phone, email, preferred_time, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name und Telefonnummer sind Pflichtfelder.' });
  }
  const { error } = await supabase
    .from('demo_requests')
    .insert([{ name, company, phone, email, preferred_time, notes }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
});

// Für Dashboard: Alle Demo-Anfragen holen
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
