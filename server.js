const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const supabase = require('./supabaseclient'); // ✅ Nur einmal laden

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Statische Dateien bereitstellen (Frontend liegt z. B. in /public)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Routen einbinden
const contactRoutes = require('./routes/contact');
const clientRoutes = require('./routes/clients');
const callRoutes = require('./routes/calls');
const klaraRoutes = require('./routes/klara');
const feedbackRoutes = require('./routes/feedback');
const statsRoutes = require('./routes/stats');


app.use('/api/contact', contactRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/calls', callRoutes);          
app.use('/api/klara', klaraRoutes);           // ✅ KI-Endpunkt
app.use('/api/feedback', feedbackRoutes);     // ✅ Feedback-Endpunkt
app.use('/api/stats', statsRoutes);           // ✅ Statistiken-Endpunkt

// ✅ Alle Anfragen abrufen für Admin-Dashboard
app.get('/api/requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const cleanData = data.map(req => ({
      ...req,
      status: req.status?.replace(/'/g, '')
    }));

    res.status(200).json(cleanData);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Anfragen:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Anfrage als erledigt markieren
app.patch('/api/requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { error } = await supabase
      .from('contact_requests')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Anfrage löschen
app.delete('/api/requests/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('contact_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Fehler beim Löschen:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Weiterleitung zur Login-Seite (Startseite)
app.get('/', (req, res) => {
  res.redirect('/adminpassword.html');
});

// ✅ Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
