const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Google API Credentials
const CLIENT_ID = '436112584104-o10rg7b4krp0c8eabq1n90gv2m2lbeel.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
);

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('1. Öffne diese URL in deinem Browser:\n', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('\n2. Füge den Code von Google hier ein: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Fehler beim Token holen:', err);
      oAuth2Client.setCredentials(token);
      // Token speichern für spätere Nutzung (optional)
      fs.writeFileSync('token.json', JSON.stringify(token));
      callback(oAuth2Client);
    });
  });
}

function addTestEvent(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const event = {
    summary: 'Test-Termin von Klara',
    location: 'Telefonisch',
    description: 'Dies ist ein automatisch angelegter Termin via Klara.',
    start: {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1h
      timeZone: 'Europe/Berlin',
    },
    end: {
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2h
      timeZone: 'Europe/Berlin',
    },
  };

  calendar.events.insert(
    {
      calendarId: 'primary',
      resource: event,
    },
    (err, event) => {
      if (err) {
        return console.error('API-Fehler beim Eintragen:', err);
      }
      console.log('Termin eingetragen:', event.data.htmlLink);
    }
  );
}

// Prüfen, ob bereits ein Token gespeichert ist:
if (fs.existsSync('token.json')) {
  const token = JSON.parse(fs.readFileSync('token.json'));
  oAuth2Client.setCredentials(token);
  addTestEvent(oAuth2Client);
} else {
  getAccessToken(oAuth2Client, addTestEvent);
}
