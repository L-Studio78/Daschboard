// Einfache Hilfsfunktionen zum Parsen von iCal (ICS) Dateien
// Nutze z.B. ical.js oder manuelles Parsen für einfache Events

// Für komplexe Fälle empfehle ich die Bibliothek 'ical.js' (npm install ical.js)
// Hier ein minimalistischer Parser für VEVENTS (nur DTSTART, DTEND, SUMMARY)

export function parseICal(icsText) {
  const events = [];
  const eventBlocks = icsText.split('BEGIN:VEVENT').slice(1);
  for (const block of eventBlocks) {
    const dtstart = /DTSTART(:|;[^\n]*)\n([^\n]*)/.exec(block);
    const dtend = /DTEND(:|;[^\n]*)\n([^\n]*)/.exec(block);
    const summary = /SUMMARY:(.*)/.exec(block);
    events.push({
      start: dtstart ? dtstart[2] : '',
      end: dtend ? dtend[2] : '',
      summary: summary ? summary[1].trim() : '',
    });
  }
  return events;
}
