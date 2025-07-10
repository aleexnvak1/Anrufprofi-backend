const express = require('express');
const router = express.Router();
const supabase = require('../supabaseclient');

//
// 🔍 Alle Kunden abrufen
//
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Fehler beim Abrufen der Kunden:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, clients: data });
});

//
// 📄 Einzelnen Kunden abrufen
//
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Fehler beim Laden des Kundenprofils:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, client: data });
});

//
// ➕ Neuen Kunden anlegen
//
router.post('/', async (req, res) => {
  const {
    company_name,
    contact_name,
    greeting_text,
    ai_instructions,
    subscription,
    ai_name = 'Klara'
  } = req.body;

  if (!company_name || !contact_name || !greeting_text || !ai_instructions || !subscription) {
    return res.status(400).json({ error: '❌ Fehlende Pflichtfelder.' });
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        company_name,
        contact_name,
        greeting_text,
        ai_instructions,
        subscription,
        ai_name
      }
    ])
    .select();

  if (error) {
    console.error('❌ Supabase-Fehler beim Einfügen:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(500).json({ error: '❌ Kein Datensatz zurückgegeben.' });
  }

  res.status(201).json({ success: true, client: data[0] });
});

//
// ✏️ Kunden aktualisieren
//
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase-Fehler beim Aktualisieren:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, client: data });
});

//
// 🗑️ Kunden löschen
//
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Fehler beim Löschen:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ success: true, message: '✅ Kunde gelöscht' });
});

module.exports = router;
