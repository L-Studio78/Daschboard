import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, Title } from 'chart.js';
import { ThemeContext } from '../ThemeContext';
import './LearningStats.css'; // Importiere das neue CSS

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, Title);

const API_URL = 'http://localhost:5000/api';

const LearningStats = () => {
  const { theme } = useContext(ThemeContext);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchLearningSessions();
  }, []);

  const fetchLearningSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/learning-sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching learning sessions:', error);
    }
  };

  // Prepare data for daily learning chart
  const dailyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const dataByDay = last7Days.map(day => {
      const sessionsOnDay = sessions.filter(session => {
        const sessionDate = new Date(session.session_date);
        return sessionDate.toDateString() === day.toDateString();
      });
      const totalMinutes = sessionsOnDay.reduce((sum, session) => sum + session.duration_minutes, 0);
      return totalMinutes;
    });

    const rootStyles = getComputedStyle(document.documentElement);

    return {
      labels: last7Days.map(d => d.toLocaleDateString('de-DE', { weekday: 'short' })),
      datasets: [
        {
          label: 'Minuten gelernt',
          data: dataByDay,
          backgroundColor: rootStyles.getPropertyValue('--chart-color-1').trim(),
          borderColor: rootStyles.getPropertyValue('--chart-color-1').trim().replace(/, ?0\.[0-9]+\)/, ', 1)'),
          borderWidth: 1,
        },
      ],
    };
  }, [sessions, theme]);

  const dailyOptions = useMemo(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const textColor = rootStyles.getPropertyValue('--text-color').trim();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor } },
        title: { display: true, text: 'Lernzeit pro Tag (letzte 7 Tage)', color: textColor },
      },
      scales: {
        x: { ticks: { color: textColor } },
        y: { ticks: { color: textColor }, beginAtZero: true },
      },
    };
  }, [theme]);

  // Prepare data for monthly learning chart
  const monthlyData = useMemo(() => {
    const monthlyAggregates = sessions.reduce((acc, session) => {
      const date = new Date(session.session_date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      acc[monthYear] = (acc[monthYear] || 0) + session.duration_minutes;
      return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyAggregates).sort((a, b) => {
      const [aY, aM] = a.split('-').map(Number);
      const [bY, bM] = b.split('-').map(Number);
      if (aY !== bY) return aY - bY;
      return aM - bM;
    });

    const labels = sortedMonths.map(my => {
      const [year, month] = my.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    });

    const data = sortedMonths.map(my => monthlyAggregates[my]);

    const rootStyles = getComputedStyle(document.documentElement);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Minuten gelernt',
          data: data,
          backgroundColor: rootStyles.getPropertyValue('--chart-color-2').trim(),
          borderColor: rootStyles.getPropertyValue('--chart-color-2').trim().replace(/, ?0\.[0-9]+\)/, ', 1)'),
          borderWidth: 1,
        },
      ],
    };
  }, [sessions, theme]);

  const monthlyOptions = useMemo(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const textColor = rootStyles.getPropertyValue('--text-color').trim();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor } },
        title: { display: true, text: 'Lernzeit pro Monat', color: textColor },
      },
      scales: {
        x: { ticks: { color: textColor } },
        y: { ticks: { color: textColor }, beginAtZero: true },
      },
    };
  }, [theme]);

  return (
    <div className="learning-stats-widget">
      <h2>Lernstatistik</h2>
      <div className="chart-container">
        <Bar data={dailyData} options={dailyOptions} />
      </div>
      <div className="chart-container">
        <Bar data={monthlyData} options={monthlyOptions} />
      </div>
    </div>
  );
};

export default LearningStats;
