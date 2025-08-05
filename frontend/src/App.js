import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from './ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Link und FaGear werden jetzt im Header verwendet
// import { FaGear } from 'react-icons/fa6'; // Nicht mehr direkt hier benötigt
// import * as FaIcons from 'react-icons/fa6'; // Nicht mehr direkt hier benötigt
import './App.css';
// import { fetchWeather } from './utils/weather'; // Wird jetzt im Header verwendet

import Dashboard from './components/Dashboard';
import BookManager from './components/BookManager';
import HabitTracker from './components/HabitTracker';
import LearningTimer from './components/LearningTimer';
import Settings from './components/Settings';
import Header from './components/Header'; // Importiere die neue Header-Komponente
import CalendarPage from './components/CalendarPage';

function App() {
  const { theme } = useContext(ThemeContext);
  const [books, setBooks] = useState([]);
  // Uhrzeit, Wetter und Custom Links States sind jetzt in der Header-Komponente

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/books');
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };
    fetchBooks();

  }, []);

  return (
    <Router>
      <div className="App" data-theme={theme}>
        <Header /> {/* Die neue Header-Komponente */}

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard books={books} />} />
            <Route path="/books" element={<BookManager books={books} setBooks={setBooks} />} />
            <Route path="/habits" element={<HabitTracker />} />
            <Route path="/timer" element={<LearningTimer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
