import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './HabitCalendar.css';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function dateToKey(date) {
  return date.toISOString().slice(0, 10);
}

const HabitCalendar = ({ habits }) => {
  const [date, setDate] = useState(new Date());
  const [completions, setCompletions] = useState({});

  useEffect(() => {
    async function fetchCompletions() {
      // Load completions for the visible month
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const from = monthStart.toISOString().slice(0, 10);
      const to = monthEnd.toISOString().slice(0, 10);
      const res = await axios.get(`${API_URL}/habits/completions?from=${from}&to=${to}`);
      // Group completions by date
      const grouped = {};
      res.data.forEach(c => {
        if (!grouped[c.completion_date]) grouped[c.completion_date] = [];
        grouped[c.completion_date].push(c);
      });
      setCompletions(grouped);
    }
    fetchCompletions();
  }, [date, habits]);

  // Custom tile content: show number of completions per day
  function tileContent({ date, view }) {
    if (view !== 'month') return null;
    const key = dateToKey(date);
    const dayCompletions = completions[key] || [];
    if (dayCompletions.length === 0) return null;
    return (
      <div className="habit-calendar-dot">
        <span>{dayCompletions.length}</span>
      </div>
    );
  }

  return (
    <div className="habit-calendar-card">
      <h3>Habit Kalender</h3>
      <Calendar
        onChange={setDate}
        value={date}
        tileContent={tileContent}
        calendarType="iso8601"
      />
      <p className="habit-calendar-selected-date">
        Ausgewähltes Datum: <b>{date.toLocaleDateString()}</b>
      </p>
      {/* Optional: Liste der Habits für den Tag */}
      <div className="habit-calendar-day-list">
        <b>Habits an diesem Tag:</b>
        <ul>
          {(completions[dateToKey(date)] || []).map((c, i) => (
            <li key={i}>Habit #{c.habit_id}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HabitCalendar;
