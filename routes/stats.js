const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');

// Dashboard-Statistiken für einen Kunden
router.get('/:client_id', async (req, res) => {
  const client_id = req.params.client_id;

  try {
    // Anrufe gesamt
    const { count: total_calls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client_id);

    // Durchschnittliche Gesprächsdauer
    const { data: callsData } = await supabase
      .from('calls')
      .select('duration_seconds')
      .eq('client_id', client_id);

    const avg_duration = callsData && callsData.length
      ? Math.round(callsData.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / callsData.length)
      : 0;  //

    // Erfolgreich bearbeitet (%)
    const { count: success_calls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client_id)
      .eq('status', 'Erfolgreich');

    const success_rate = total_calls ? Math.round((success_calls / total_calls) * 100) : 0;

    // Gebuchte Termine – hier ggf. anpassen falls in eigener Tabelle!
    const calendar_bookings = 10;

    // Feedback-Auswertung (z.B. Daumen hoch/runter/neutral)
    const { data: feedbackRows } = await supabase
      .from('call_feedback')
      .select('rating')
      .eq('client_id', client_id);
    const positive = feedbackRows.filter(f => f.rating === 'up').length;
    const neutral = feedbackRows.filter(f => f.rating === 'neutral').length;
    const negative = feedbackRows.filter(f => f.rating === 'down').length;
    const allFeedback = feedbackRows.length;
    const positive_feedback = allFeedback ? Math.round((positive / allFeedback) * 100) : 0;

    // Wiederkehrende Anrufer (dummy)
    const repeating_callers = 4;

    // Minutenverbrauch & Limit
    const minutes_used = callsData
      ? Math.round(callsData.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60)
      : 0;
    // Limit: hier statisch, besser aus Kundendaten holen!
    const minutes_limit = 250;

    // Anrufe pro Tag (Demo, da Supabase keine group by date aggregation hat)
    const daily_calls = [
      { date: "2024-07-11", count: 12 },
      { date: "2024-07-12", count: 18 },
      { date: "2024-07-13", count: 15 },
      { date: "2024-07-14", count: 20 },
      { date: "2024-07-15", count: 16 },
      { date: "2024-07-16", count: 14 },
      { date: "2024-07-17", count: 21 }
    ];

    // Feedback-Verteilung für Pie-Chart
    const feedback_counts = { positive, neutral, negative };

    res.json({
      total_calls,
      avg_duration,
      success_rate,
      calendar_bookings,
      positive_feedback,
      repeating_callers,
      minutes_used,
      minutes_limit,
      daily_calls,
      feedback_counts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Statistiken konnten nicht geladen werden." });
  }
});

module.exports = router;
