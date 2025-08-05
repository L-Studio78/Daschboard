import React, { useState, useEffect } from 'react';
import { fetchWeather } from '../utils/weather';
import './WeatherClockWidget.css';

const WeatherClockWidget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCity, setWeatherCity] = useState(localStorage.getItem('dashboard_weather_city') || 'Berlin');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getWeather = async () => {
      const city = localStorage.getItem('dashboard_weather_city') || 'Berlin';
      setWeatherCity(city);
      const data = await fetchWeather(city);
      setWeatherData(data);
    };
    getWeather();
    const interval = setInterval(getWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="weather-clock-widget">
      <div className="clock-section">
        <span className="clock-time">{currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        <span className="clock-date">{currentTime.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </div>
      <div className="weather-section">
        {weatherData ? (
          <>
            <span className="weather-emoji">{weatherData.icon}</span>
            <span className="weather-temp">{Math.round(weatherData.temperature)}°C</span>
            <span className="weather-desc">{weatherData.description}</span>
            <span className="weather-city">{weatherData.city}</span>
          </>
        ) : (
          <span className="weather-error">Wetter nicht verfügbar</span>
        )}
      </div>
    </div>
  );
};

export default WeatherClockWidget;