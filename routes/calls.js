const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');

// ➕ Neuen Anruf speichern
router.post('/', async (req, res) => {
  const { client_id, duration_seconds, status } = req.body;

  if (!client_id || typeof duration_seconds !== 'number' || !status) {
    return res.status(400).json({ error: '❌ Fehlende oder ungültige Felder.' });
  }

  const { data, error } = await supabase
    .from('calls')
    .insert([
      {
        client_id,
        duration_seconds,
        status,
        timestamp: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ success: true, call: data });
});

// 📊 Minuten pro Kunde pro Monat (über Supabase-RPC)
router.get('/stats/:client_id', async (req, res) => {
  const { client_id } = req.params;

  const { data, error } = await supabase
    .rpc('get_call_minutes_per_month', { p_client_id: client_id });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// 📊 Zusammenfassung & Tagesstatistik (letzte 30 Tage)
router.get('/stats/summary/:client_id', async (req, res) => {
  const { client_id } = req.params;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: totalCalls, error: totalErr } = await supabase
    .from('calls')
    .select('duration_seconds')
    .eq('client_id', client_id)
    .gte('timestamp', since);

  if (totalErr) return res.status(500).json({ error: totalErr.message });

  const call_count = totalCalls.length;
  const total_minutes = Math.round(
    totalCalls.reduce((sum, c) => sum + c.duration_seconds, 0) / 60
  );

  const { data: dailyStats, error: dailyErr } = await supabase
    .rpc('get_daily_minutes', { cid: client_id });

  if (dailyErr) return res.status(500).json({ error: dailyErr.message });

  res.json({
    call_count,
    total_minutes,
    daily_stats: dailyStats
  });
});

// 📋 Alle Anrufe eines Kunden (für Feedbackliste etc.)
router.get('/by-client/:client_id', async (req, res) => {
  const { client_id } = req.params;

  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', client_id)
    .order('timestamp', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

module.exports = router;
