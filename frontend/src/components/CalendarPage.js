import React, { useState, useEffect } from 'react';
import DashboardCalendar from './DashboardCalendar';
import { parseICal } from '../utils/ical-utils';
import './CalendarPage.css';

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

const CalendarPage = () => {
  const [activeTab, setActiveTab] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [icalLink, setIcalLink] = useState(localStorage.getItem('dashboard_ical_link') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (icalLink && icalLink.startsWith('http')) {
      fetchICalFromLink(icalLink);
    }
  }, [icalLink]);

  const fetchICalFromLink = async (url) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(url);
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

  // Hilfsfunktionen für Filter
  function isSameDay(dateStr, d) {
    const date = new Date(dateStr);
    return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth() && date.getDate() === d.getDate();
  }
  function isSameWeek(dateStr, d) {
    const monday = getMonday(d);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const date = new Date(dateStr);
    return date >= monday && date <= sunday;
  }

  // Events für die aktuelle Woche/Tag filtern
  const weekEvents = events.filter(ev => isSameWeek(ev.start, date));
  let dayEvents = events.filter(ev => isSameDay(ev.start, date));
  // Sortiere nach Startzeit
  dayEvents = dayEvents.sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 10);

  // Farbpalette für Termine
  const eventColors = [
    '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac', '#ffb74d', '#a1887f', '#90a4ae', '#f06292'
  ];
  function getEventColor(title, idx) {
    if (!title) return eventColors[idx % eventColors.length];
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return eventColors[Math.abs(hash) % eventColors.length];
  }

  // Wochentage für die aktuelle Woche
  const monday = getMonday(date);
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="calendar-page-root">
      <h2>Kalender</h2>
      <div className="calendar-tabs">
        <button className={activeTab === 'month' ? 'active' : ''} onClick={() => setActiveTab('month')}>Monat</button>
        <button className={activeTab === 'week' ? 'active' : ''} onClick={() => setActiveTab('week')}>Woche</button>
        <button className={activeTab === 'day' ? 'active' : ''} onClick={() => setActiveTab('day')}>Tag</button>
      </div>
      <div className="calendar-tab-content">
        {activeTab === 'month' && <DashboardCalendar />}
        {activeTab === 'week' && (
          <div className="calendar-week-view">
            <div className="week-days-row">
              {weekDays.map((d, idx) => (
                <div key={idx} className="week-day-col">
                  <div className="week-day-label">{d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                  <ul className="week-events-list">
                    {weekEvents.filter(ev => isSameDay(ev.start, d)).length === 0 && <li className="no-events">-</li>}
                    {weekEvents.filter(ev => isSameDay(ev.start, d)).map((ev, i) => (
                      <li key={i} className="event-item">
                        <b>{ev.summary || '(kein Titel)'}</b><br/>
                        <span>{ev.start} - {ev.end}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'day' && (
          <div className="calendar-day-view">
            <div className="day-label">{date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <ul className="day-events-list">
              {dayEvents.length === 0 && <li className="no-events">Keine Termine</li>}
              {dayEvents.map((ev, i) => {
                const start = new Date(ev.start);
                const end = new Date(ev.end);
                return (
                  <li key={i} className="event-item" style={{ borderLeft: `8px solid ${getEventColor(ev.summary, i)}` }}>
                    <div className="event-time-row">
                      <span className="event-time-red">{start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="event-date-red">{start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <div className="event-title">{ev.summary || '(kein Titel)'}</div>
                    <div className="event-time-range">{start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {loading && <p className="loading-message">Lade iCal-Daten...</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default CalendarPage;