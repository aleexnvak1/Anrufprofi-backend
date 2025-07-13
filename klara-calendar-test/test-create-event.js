const fs = require('fs');
const { google } = require('googleapis');

// ======= Google API Credentials =======
const CLIENT_ID = '436112584104-o10rg7b4krp0c8eabq1n90gv2m2lbeel.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// ======= Auth vorbereiten =======
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
);

// Token laden
if (!fs.existsSync('token.json')) {
  console.error('token.json nicht gefunden! Bitte zuerst mit index.js authentifizieren.');
  process.exit(1);
}
const token = JSON.parse(fs.readFileSync('token.json'));
oAuth2Client.setCredentials(token);

// ======= Termin-Definition =======
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

const event = {
  summary: 'Test-Termin von Klara (per Script)',
  description: 'Dieser Termin wurde automatisch per Node.js-Script angelegt.',
  start: {
    dateTime: '2025-07-15T16:00:00+02:00',
    timeZone: 'Europe/Berlin',
  },
  end: {
    dateTime: '2025-07-15T17:00:00+02:00',
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
    console.log('✅ Termin eingetragen:');
    console.log(event.data.htmlLink);
  }
);
