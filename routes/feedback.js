const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');

// ➕ Feedback speichern
router.post('/', async (req, res) => {
  const { call_id, client_id, feedback_text, is_positive } = req.body;

  if (!call_id || !client_id) {
    return res.status(400).json({ error: '❌ call_id und client_id sind Pflicht' });
  }

  const { data, error } = await supabase
    .from('call_feedback')
    .insert([{ call_id, client_id, feedback_text, is_positive }])
    .select()
    .single(); // ✅ sichert valides Objekt

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ success: true, feedback: data });
});

// ✅ Feedback-Liste mit Join auf calls + clients
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('call_feedback')
    .select(`
      id,
      feedback_text,
      is_positive,
      created_at,
      calls:call_id (timestamp),
      clients:client_id (company_name)
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
});

module.exports = router;
