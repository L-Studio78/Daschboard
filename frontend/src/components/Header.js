import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaGear } from 'react-icons/fa6';
import * as FaIcons from 'react-icons/fa6'; // Importiere alle Fa6 Icons
import { ThemeContext } from '../ThemeContext';
import { fetchWeather } from '../utils/weather';
import './Header.css'; // Importiere das neue CSS für den Header

const Header = () => {
  const { theme } = useContext(ThemeContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCity, setWeatherCity] = useState(localStorage.getItem('dashboard_weather_city') || 'London');
  const [customLinks, setCustomLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dashboard_custom_links')) || [];
    } catch (e) {
      console.error("Failed to parse custom links from localStorage", e);
      return [];
    }
  });

  // Effekt, um benutzerdefinierte Links bei Änderung des Local Storage neu zu laden
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setCustomLinks(JSON.parse(localStorage.getItem('dashboard_custom_links')) || []);
      } catch (e) {
        console.error("Failed to parse custom links from localStorage on change", e);
        setCustomLinks([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getWeatherData = async () => {
      const city = localStorage.getItem('dashboard_weather_city') || 'London';
      setWeatherCity(city);
      const data = await fetchWeather(city);
      setWeatherData(data);
    };

    getWeatherData();

    // Fetch weather every 10 minutes (adjust as needed)
    const weatherInterval = setInterval(getWeatherData, 10 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, [weatherCity]); // Re-fetch when weatherCity changes

  // Hilfskomponente für dynamische Icons
  const DynamicIcon = ({ iconName, size = 18 }) => {
    const IconComponent = FaIcons[iconName];
    if (!IconComponent) return null; // Icon nicht gefunden
    return <IconComponent size={size} />;
  };

  return (
    <header className="app-header">
      <nav className="main-nav">
        <Link to="/">Dashboard</Link>
        <Link to="/books">Books</Link>
        <Link to="/habits">Habits</Link>
        <Link to="/calendar">Kalender</Link>
        <Link to="/timer">Timer</Link>
        {customLinks.map(link => (
          <Link key={link.id} to={link.url} target="_blank" rel="noopener noreferrer">
            {link.icon && <DynamicIcon iconName={link.icon} />} {link.name}
          </Link>
        ))}
      </nav>
      <div className="header-info">
        <div className="current-time">
          {currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        {weatherData ? (
          <div className="weather-info">
            {weatherData.icon && (
              <span className="weather-emoji" style={{ fontSize: 28, marginRight: 4 }}>{weatherData.icon}</span>
            )}
            <span>{Math.round(weatherData.temperature)}°C</span>
            <span className="weather-description">{weatherData.description}</span>
            <span className="weather-city">in {weatherData.city}</span>
          </div>
        ) : (
          <div className="weather-info weather-error">
            Wetter nicht verfügbar
          </div>
        )}
      </div>
      <div className="settings-link">
        <Link to="/settings">
          <FaGear size={24} />
        </Link>
      </div>
    </header>
  );
};

export default Header;