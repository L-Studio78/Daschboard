import React, { useContext, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
import { ThemeContext } from '../ThemeContext';
import './BookStats.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const BookStats = ({ books }) => {
  const { theme } = useContext(ThemeContext);

  // Hilfsfunktion: Liste der letzten 10 Monate [{month, year, label}]
  const lastMonths = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString('de-DE', { month: 'short', year: '2-digit' })
      });
    } return arr;
  }, []);

  // Bücher pro Monat (letzte 10)
  const booksByMonth = useMemo(() => {
    if (!books) return Array(10).fill([]);
    return lastMonths.map(({ month, year }) =>
      books.filter(b => {
        if (!b.added_date) return false;
        const d = new Date(b.added_date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
    );
  }, [books, lastMonths]);

  // Chart-Daten
  const chartData = useMemo(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
      labels: lastMonths.map(m => m.label),
      datasets: [
        {
          label: 'Gelesene Bücher',
          data: booksByMonth.map(list => list.length),
          backgroundColor: rootStyles.getPropertyValue('--chart-color-1').trim(),
          borderColor: rootStyles.getPropertyValue('--chart-color-1').trim().replace(/, ?0\.[0-9]+\)/, ', 1)'),
          borderWidth: 1,
        },
      ],
    };
  }, [booksByMonth, lastMonths, theme]);

  const chartOptions = useMemo(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const textColor = rootStyles.getPropertyValue('--text-color').trim();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor } },
        title: { display: true, text: 'Gelesene Bücher pro Monat (letzte 10)', color: textColor },
      },
      scales: {
        x: { ticks: { color: textColor } },
        y: { ticks: { color: textColor }, beginAtZero: true },
      },
    };
  }, [theme]);

  if (!books || books.length === 0) {
    return (
      <div className="stats-widget chart-widget">
        <h3>Bücher-Vergleich</h3>
        <p>Keine Buchdaten vorhanden. Füge Bücher hinzu!</p>
      </div>
    );
  }

  return (
    <div className="stats-widget chart-widget">
      <h3>Bücher-Vergleich (letzte 10 Monate)</h3>
      <div className="chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default BookStats;
