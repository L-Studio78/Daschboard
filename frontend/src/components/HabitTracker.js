import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HabitTracker.css'; // Importiere das neue CSS

const API_URL = 'http://localhost:5000/api';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [streaks, setStreaks] = useState([]);

  useEffect(() => {
    fetchHabits();
    fetchStreaks();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API_URL}/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchStreaks = async () => {
    try {
      const response = await axios.get(`${API_URL}/habits/streaks`);
      setStreaks(response.data);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) {
      alert('Bitte gib einen Namen für das Habit ein!');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/habits`, { name: newHabitName });
      fetchHabits();
      fetchStreaks(); // Refresh streaks after adding a habit
      setNewHabitName('');
    } catch (error) {
      console.error('Error adding habit:', error);
      alert('Fehler beim Hinzufügen des Habits: ' + (error.response?.data?.message || error.message));
    }
  };


  const handleToggleHabit = async (id) => {
    try {
      await axios.post(`${API_URL}/habits/toggle/${id}`);
      fetchHabits();
      fetchStreaks(); // Refresh streaks after toggling
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await axios.delete(`${API_URL}/habits/${id}`);
        fetchHabits();
        fetchStreaks(); // Refresh streaks after deleting
      } catch (error) {
        console.error('Error deleting habit:', error);
      }
    }
  };

  const getStreakForHabit = (habitId) => {
    const habitStreak = streaks.find(s => s.habit_id === habitId);
    return habitStreak ? habitStreak.streak : 0;
  };

  return (
    <div className="habit-widget">
      <h3>Habit Tracker</h3>
      <form onSubmit={handleAddHabit} className="habit-add-form">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="Enter a new habit"
          className="habit-input"
        />
        <button type="submit" className="add-habit-button">Add Habit</button>
      </form>
      <div className="habit-list">
        {habits.map(habit => (
          <div key={habit.id} className="habit-item">
            <input
              type="checkbox"
              checked={habit.completed_today}
              onChange={() => handleToggleHabit(habit.id)}
              className="habit-checkbox"
            />
            <span className="habit-name" style={{ textDecoration: habit.completed_today ? 'line-through' : 'none' }}>
              {habit.name}
            </span>
            <span className="habit-streak">Streak: {getStreakForHabit(habit.id)} days</span>
            <button onClick={() => handleDeleteHabit(habit.id)} className="delete-habit-button">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitTracker;
