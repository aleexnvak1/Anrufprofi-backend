const express = require('express');
const app = express();
app.use(express.json());

app.post('/incoming-call', async (req, res) => {
  const caller = req.body.caller || '+49123456789';
  console.log('📞 Neuer Anruf von:', caller);

  // Simuliere Sprachausgabe oder Reaktion
  const responseText = `Hallo! Hier ist Klara. Sie erreichen uns außerhalb der Geschäftszeiten.`;
  
  res.status(200).json({
    speech: responseText
  });
});

app.listen(3002, () => console.log('✅ Webhook läuft auf http://localhost:3002'));
