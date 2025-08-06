import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import './HabitDetail.css';

const API_URL = 'http://localhost:5000/api';

const HabitDetail = ({ habit, onBack }) => {
  const [completions, setCompletions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [stats, setStats] = useState({ total: 0, month: 0 });

  useEffect(() => {
    if (habit) fetchCompletions();
  }, [habit]);

  useEffect(() => {
    if (completions.length > 0) calcStats();
  }, [completions]);

  const fetchCompletions = async () => {
    const res = await axios.get(`${API_URL}/habits/${habit.id}/completions`);
    setCompletions(res.data);
  };

  const saveCompletion = async () => {
    if (!inputValue || isNaN(Number(inputValue))) return;
    await axios.post(`${API_URL}/habits/${habit.id}/complete`, {
      date: selectedDate,
      value: Number(inputValue),
      unit: habit.unit
    });
    setInputValue('');
    fetchCompletions();
  };

  const getValueForDate = date => {
    const d = new Date(date).toISOString().slice(0, 10);
    const found = completions.find(c => c.completion_date === d);
    return found ? found.value : null;
  };

  const calcStats = () => {
    let total = 0;
    let month = 0;
    const now = new Date();
    completions.forEach(c => {
      total += Number(c.value || 0);
      const cDate = new Date(c.completion_date);
      if (cDate.getFullYear() === now.getFullYear() && cDate.getMonth() === now.getMonth()) {
        month += Number(c.value || 0);
      }
    });
    setStats({ total, month });
  };

  return (
    <div className="habit-detail-glass">
      <button className="habit-detail-back" onClick={onBack}>← Zurück</button>
      <h2>{habit.name} <span className="habit-detail-unit">({habit.unit})</span></h2>
      <div className="habit-detail-stats">
        <div>Insgesamt: <b>{stats.total} {habit.unit}</b></div>
        <div>Diesen Monat: <b>{stats.month} {habit.unit}</b></div>
      </div>
      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        calendarType="iso8601"
        tileContent={({ date }) => {
          const value = getValueForDate(date);
          return value ? (
            <div className="habit-detail-dot">{value}</div>
          ) : null;
        }}
      />
      <div className="habit-detail-day-value">
        <b>Am {selectedDate.toLocaleDateString()}:</b> {getValueForDate(selectedDate) ? `${getValueForDate(selectedDate)} ${habit.unit}` : 'Noch kein Eintrag'}
      </div>
      <div className="habit-detail-input-row">
        <label>Wert für {selectedDate.toLocaleDateString()}:</label>
        <input
          type="number"
          min="0"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={habit.type === 'time' ? 'Minuten...' : 'Anzahl...'}
        />
        <button onClick={saveCompletion}>Speichern</button>
      </div>
      <div className="habit-detail-log">
        <h4>Letzte Einträge</h4>
        <ul>
          {completions.slice(-10).reverse().map(c => (
            <li key={c.completion_date}>{c.completion_date}: <b>{c.value} {habit.unit}</b></li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HabitDetail;
