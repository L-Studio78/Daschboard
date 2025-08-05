import React, { createContext, useState, useMemo } from 'react';

export const ThemeContext = createContext();

export const themes = {
  light: {
    name: 'Light',
    colors: { background: '#ffffff', text: '#282c34', primary: '#f0f0f0' }
  },
  dark: {
    name: 'Dark',
    colors: { background: '#20232a', text: '#ffffff', primary: '#282c34' }
  },
  mint: {
    name: 'Mint',
    colors: { background: '#f1f8f6', text: '#0b3d2c', primary: '#a8d5c5' }
  },
  synthwave: {
    name: 'Synthwave',
    colors: { background: '#2a1b3d', text: '#e1f2fb', primary: '#d83f87' }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // default theme key

  // Memoize the value to prevent unnecessary re-renders
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
