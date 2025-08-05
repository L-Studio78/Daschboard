import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const POMODORO_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

const LearningTimer = () => {
  const [minutes, setMinutes] = useState(POMODORO_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished
            if (mode === 'pomodoro') {
              saveLearningSession(POMODORO_MINUTES);
              alert('Pomodoro complete! Time for a break.');
            } else {
              alert('Break is over! Back to work.');
            }
            handleReset();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds, minutes, mode]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    switch (mode) {
      case 'pomodoro':
        setMinutes(POMODORO_MINUTES);
        break;
      case 'shortBreak':
        setMinutes(SHORT_BREAK_MINUTES);
        break;
      case 'longBreak':
        setMinutes(LONG_BREAK_MINUTES);
        break;
      default:
        setMinutes(POMODORO_MINUTES);
    }
    setSeconds(0);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    switch (newMode) {
      case 'pomodoro':
        setMinutes(POMODORO_MINUTES);
        break;
      case 'shortBreak':
        setMinutes(SHORT_BREAK_MINUTES);
        break;
      case 'longBreak':
        setMinutes(LONG_BREAK_MINUTES);
        break;
      default:
        setMinutes(POMODORO_MINUTES);
    }
    setSeconds(0);
  };

    const saveLearningSession = async (duration) => {
    try {
      await axios.post(`${API_URL}/learning-sessions`, { duration_minutes: duration });
      console.log('Learning session saved!');
    } catch (error) {
      console.error('Error saving learning session:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Learning Timer</h2>
      <div>
        <button onClick={() => switchMode('pomodoro')}>Pomodoro</button>
        <button onClick={() => switchMode('shortBreak')}>Short Break</button>
        <button onClick={() => switchMode('longBreak')}>Long Break</button>
      </div>
      <div style={{ margin: '18px 0' }}>
        <label style={{ fontWeight: 500, marginRight: 8 }}>
          Minuten:
          <input
            type="number"
            min="1"
            max="180"
            value={minutes}
            disabled={isActive}
            onChange={e => setMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
            style={{ width: 60, fontSize: '1.2rem', marginLeft: 6, textAlign: 'center', borderRadius: 6, border: '1px solid #ccc', padding: '2px 4px' }}
          />
        </label>
      </div>
      <div style={{ fontSize: '6rem', margin: '20px 0' }}>
        {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </div>
      <div>
        <button onClick={handleStartPause}>{isActive ? 'Pause' : 'Start'}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
};

export default LearningTimer;
