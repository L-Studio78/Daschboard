import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Das Standard-CSS für react-calendar bleibt hier
import './DashboardCalendar.css'; // Importiere das neue CSS
import { parseICal } from '../utils/ical-utils';

const DashboardCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [icalLink, setIcalLink] = useState(localStorage.getItem('dashboard_ical_link') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wenn ein Link gespeichert ist, automatisch laden
    if (icalLink && icalLink.startsWith('http')) {
      fetchICalFromLink(icalLink);
    }
    // eslint-disable-next-line
  }, [icalLink]);

  const fetchICalFromLink = async (url) => {
    setLoading(true);
    setError('');
    try {
      let fetchUrl = url;
      if (url.includes('calendar.google.com')) {
        // Automatisch CORS-Proxy für Google Kalender verwenden
        fetchUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      }
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Fehler beim Laden des iCal-Links');
      const text = await res.text();
      const parsed = parseICal(text);
      setEvents(parsed);
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // handleReload wird nicht mehr benötigt, da der Link über Settings aktualisiert wird

  return (
    <div className="calendar-widget">
      <h3>Kalender</h3>
      <Calendar onChange={setDate} value={date} />
      <p className="selected-date-info">Ausgewähltes Datum: <b>{date.toLocaleDateString()}</b></p>
      
      {loading && <p className="loading-message">Lade iCal-Daten...</p>}
      {error && <p className="error-message">{error}</p>}
      {events.length > 0 && (
        <div>
          <h4 className="events-title">Importierte Termine:</h4>
          <ul className="event-list">
            {events.map((ev, idx) => (
              <li key={idx} className="event-item">
                <b>{ev.summary || '(kein Titel)'}</b> <br />
                <span>{ev.start} - {ev.end}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {events.length === 0 && !loading && !error && (
        <p className="no-events-message">Keine Termine gefunden. Trage einen gültigen iCal-Link in den Einstellungen ein.</p>
      )}
    </div>
  );
};

export default DashboardCalendar;
