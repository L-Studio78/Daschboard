import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HabitsOverview.css';

const API_URL = 'http://localhost:5000/api';

const HabitsOverview = ({ onSelectHabit }) => {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState({ name: '', type: 'count', unit: '' });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const res = await axios.get(`${API_URL}/habits`);
    setHabits(res.data);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;
    await axios.post(`${API_URL}/habits`, newHabit);
    setNewHabit({ name: '', type: 'count', unit: '' });
    fetchHabits();
  };

  return (
    <div className="habits-overview-card">
      <h2>Meine Habits</h2>
      <form className="habit-add-form" onSubmit={handleAddHabit}>
        <input
          type="text"
          placeholder="Habit-Name..."
          value={newHabit.name}
          onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
          required
        />
        <select
          value={newHabit.type}
          onChange={e => {
            const t = e.target.value;
            setNewHabit({ ...newHabit, type: t, unit: t === 'time' ? 'min' : 'x' });
          }}
        >
          <option value="count">Anzahl</option>
          <option value="time">Minuten</option>
        </select>
        <input
          type="text"
          value={newHabit.type === 'time' ? 'min' : 'x'}
          readOnly
          style={{ width: '4ch', background: '#f0f0f0', color: '#888', cursor: 'not-allowed' }}
        />
        <button type="submit">+</button>
      </form>
      <div className="habits-list">
        {habits.map(habit => (
          <div
            key={habit.id}
            className="habit-card"
            onClick={() => onSelectHabit(habit)}
          >
            <div className="habit-title">{habit.name}</div>
            <div className="habit-meta">
              {habit.type === 'time' ? '⏱️' : '🔢'} {habit.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitsOverview;
