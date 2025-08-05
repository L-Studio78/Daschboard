// Open-Meteo API (kein API-Key nötig)
const CITY_COORDS = {
  'Berlin': { lat: 52.52, lon: 13.41 },
  'München': { lat: 48.14, lon: 11.58 },
  'Hamburg': { lat: 53.55, lon: 10.00 },
  'Köln': { lat: 50.94, lon: 6.96 },
  'Frankfurt': { lat: 50.11, lon: 8.68 },
  'Stuttgart': { lat: 48.78, lon: 9.18 },
  'Düsseldorf': { lat: 51.23, lon: 6.78 },
  'Dresden': { lat: 51.05, lon: 13.74 },
  'Leipzig': { lat: 51.34, lon: 12.37 },
  'London': { lat: 51.51, lon: -0.13 },
  'Paris': { lat: 48.86, lon: 2.35 },
  'Wien': { lat: 48.21, lon: 16.37 },
  'Zürich': { lat: 47.38, lon: 8.54 },
  'New York': { lat: 40.71, lon: -74.01 },
  'San Francisco': { lat: 37.77, lon: -122.42 },
  'Tokyo': { lat: 35.68, lon: 139.76 },
  'Madrid': { lat: 40.42, lon: -3.70 },
  'Rom': { lat: 41.90, lon: 12.50 },
};

export const fetchWeather = async (city) => {
  const coords = CITY_COORDS[city] || CITY_COORDS['Berlin'];
  if (!coords) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Wetterdaten konnten nicht geladen werden');
    const data = await response.json();
    if (!data.current_weather) return null;
    // Open-Meteo liefert nur Temperatur, Wind, Wettercode
    return {
      city,
      temperature: data.current_weather.temperature,
      description: weatherCodeToDescription(data.current_weather.weathercode),
      icon: weatherCodeToIcon(data.current_weather.weathercode),
    };
  } catch (e) {
    console.error('Fehler beim Laden der Wetterdaten:', e);
    return null;
  }
};

// Hilfsfunktionen für Wettercode
function weatherCodeToDescription(code) {
  const map = {
    0: 'Klar',
    1: 'Überwiegend klar',
    2: 'Teilweise bewölkt',
    3: 'Bewölkt',
    45: 'Nebel',
    48: 'Reifnebel',
    51: 'Leichter Nieselregen',
    53: 'Mäßiger Nieselregen',
    55: 'Starker Nieselregen',
    61: 'Leichter Regen',
    63: 'Mäßiger Regen',
    65: 'Starker Regen',
    71: 'Leichter Schneefall',
    73: 'Mäßiger Schneefall',
    75: 'Starker Schneefall',
    80: 'Regenschauer',
    81: 'Starke Regenschauer',
    82: 'Sehr starke Regenschauer',
    95: 'Gewitter',
    96: 'Gewitter mit leichtem Hagel',
    99: 'Gewitter mit starkem Hagel',
  };
  return map[code] || 'Unbekannt';
}

function weatherCodeToIcon(code) {
  // Einfache Emoji-Icons für Wetter
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 75) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '❓';
}