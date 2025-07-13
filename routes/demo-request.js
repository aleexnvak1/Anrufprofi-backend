// routes/demo-request.js
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');

// Demo-Anfrage speichern (POST)
router.post('/', async (req, res) => {
  const { name, company, phone, email, preferred_time, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name und Telefonnummer sind Pflichtfelder.' });
  }
  const { error } = await supabase
    .from('demo_requests')
    .insert([{ name, company, phone, email, preferred_time, notes, status: 'offen' }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
});

// Alle Demo-Anfragen holen (GET)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Demo-Anfrage als erledigt markieren (PATCH)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { error } = await supabase
    .from('demo_requests')
    .update({ status })
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Demo-Anfrage löschen (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('demo_requests')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
