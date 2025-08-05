import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext, themes } from '../ThemeContext';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const Settings = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('theme');
  const [icalLink, setIcalLink] = useState(localStorage.getItem('dashboard_ical_link') || '');
  const [weatherCity, setWeatherCity] = useState(localStorage.getItem('dashboard_weather_city') || 'London'); // Default city
  const [customLinks, setCustomLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dashboard_custom_links')) || [];
    } catch (e) {
      console.error("Failed to parse custom links from localStorage", e);
      return [];
    }
  });
  const [newLink, setNewLink] = useState({ name: '', url: '', icon: '' });
  const [editingLink, setEditingLink] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard_theme');
    if (savedTheme) setTheme(savedTheme);
  }, [setTheme]);

  useEffect(() => {
    localStorage.setItem('dashboard_custom_links', JSON.stringify(customLinks));
  }, [customLinks]);

  const handleThemeChange = (key) => {
    setTheme(key);
    localStorage.setItem('dashboard_theme', key);
  };

  const handleIcalLinkChange = (e) => {
    setIcalLink(e.target.value);
  };

  const saveIcalLink = () => {
    localStorage.setItem('dashboard_ical_link', icalLink);
    alert('iCal-Link gespeichert!');
  };

  const handleWeatherCityChange = (e) => {
    setWeatherCity(e.target.value);
  };

  const saveWeatherCity = () => {
    localStorage.setItem('dashboard_weather_city', weatherCity);
    alert('Wetter-Stadt gespeichert!');
  };

  const handleNewLinkChange = (e) => {
    const { name, value } = e.target;
    setNewLink(prev => ({ ...prev, [name]: value }));
  };

  const addOrUpdateLink = () => {
    if (!newLink.name || !newLink.url) {
      alert('Link-Name und URL sind erforderlich!');
      return;
    }

    if (editingLink) {
      setCustomLinks(prevLinks => 
        prevLinks.map(link => (link.id === editingLink.id ? { ...newLink, id: editingLink.id } : link))
      );
      setEditingLink(null);
    } else {
      setCustomLinks(prevLinks => [...prevLinks, { ...newLink, id: uuidv4() }]);
    }
    setNewLink({ name: '', url: '', icon: '' });
  };

  const startEditingLink = (link) => {
    setEditingLink(link);
    setNewLink({ name: link.name, url: link.url, icon: link.icon || '' });
    setActiveTab('links'); // Wechselt zum Links-Tab, wenn man auf Bearbeiten klickt
  };

  const deleteLink = (id) => {
    if (window.confirm('Bist du sicher, dass du diesen Link löschen möchtest?')) {
      setCustomLinks(prevLinks => prevLinks.filter(link => link.id !== id));
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-tabs">
        <button onClick={() => setActiveTab('theme')} className={activeTab === 'theme' ? 'active' : ''}>Theme</button>
        <button onClick={() => setActiveTab('calendar')} className={activeTab === 'calendar' ? 'active' : ''}>Kalender</button>
        <button onClick={() => setActiveTab('weather')} className={activeTab === 'weather' ? 'active' : ''}>Wetter</button>
        <button onClick={() => setActiveTab('links')} className={activeTab === 'links' ? 'active' : ''}>Links</button>
      </div>
      {activeTab === 'theme' && (
        <div className="settings-tab-content">
          <h2>Theme Einstellungen</h2>
          <p>Wähle ein Theme für dein Dashboard:</p>
          <div className="theme-selector">
            {Object.keys(themes).map(key => {
              const currentTheme = themes[key];
              return (
                <div key={key} className="theme-option">
                  <button
                    onClick={() => handleThemeChange(key)}
                    className={theme === key ? 'active' : ''}
                  >
                    {currentTheme.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeTab === 'calendar' && (
        <div className="settings-tab-content">
          <h2>Kalender Einstellungen</h2>
          <label>iCal-Link (z.B. von Google, Apple, Outlook):</label>
          <input
            type="text"
            value={icalLink}
            onChange={handleIcalLinkChange}
            placeholder="https://.../calendar.ics"
            className="ical-link-input"
          />
          <button onClick={saveIcalLink} className="save-button">
            Speichern
          </button>
        </div>
      )}
      {activeTab === 'weather' && (
        <div className="settings-tab-content">
          <h2>Wetter Einstellungen</h2>
          <label>Standardstadt für das Wetter:</label>
          <input
            type="text"
            value={weatherCity}
            onChange={handleWeatherCityChange}
            placeholder="z.B. Berlin, London, New York"
            className="weather-city-input"
          />
          <button onClick={saveWeatherCity} className="save-button">
            Speichern
          </button>
        </div>
      )}
      {activeTab === 'links' && (
        <div className="settings-tab-content">
          <h2>Eigene Links für das Hauptmenü</h2>
          <p>Füge hier Links hinzu, die im Hauptmenü erscheinen sollen.</p>
          <div className="link-form">
            <input
              type="text"
              name="name"
              value={newLink.name}
              onChange={handleNewLinkChange}
              placeholder="Link-Name (z.B. Google)"
            />
            <input
              type="text"
              name="url"
              value={newLink.url}
              onChange={handleNewLinkChange}
              placeholder="URL (z.B. https://www.google.com)"
            />
            <input
              type="text"
              name="icon"
              value={newLink.icon}
              onChange={handleNewLinkChange}
              placeholder="Icon Name (z.B. FaHome, FaLink) - von react-icons"
            />
            <button onClick={addOrUpdateLink} className="save-button">
              {editingLink ? 'Link aktualisieren' : 'Link hinzufügen'}
            </button>
            {editingLink && (
              <button onClick={() => { setEditingLink(null); setNewLink({ name: '', url: '', icon: '' }); }} className="cancel-button">
                Abbrechen
              </button>
            )}
          </div>
          
          <h3>Vorhandene Links:</h3>
          {customLinks.length === 0 ? (
            <p>Noch keine Links vorhanden.</p>
          ) : (
            <ul className="custom-links-list">
              {customLinks.map(link => (
                <li key={link.id} className="custom-link-item">
                  <span>{link.name} ({link.url}) {link.icon && `[${link.icon}]`}</span>
                  <div>
                    <button onClick={() => startEditingLink(link)} className="edit-button">Bearbeiten</button>
                    <button onClick={() => deleteLink(link.id)} className="delete-button">Löschen</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
