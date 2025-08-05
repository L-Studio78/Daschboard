import React from 'react';
import BookStats from './BookStats';
import LearningStats from './LearningStats';
import DashboardCalendar from './DashboardCalendar';
import HabitTracker from './HabitTracker';
import WeatherClockWidget from './WeatherClockWidget';
import './Dashboard.css';

const Dashboard = ({ books }) => {
  return (
    <div className="dashboard-root">
      <h2 className="dashboard-title">Dein Dashboard</h2>
      <div className="dashboard-grid">
        <section className="dashboard-widget weatherclock-widget">
          <WeatherClockWidget />
        </section>
        <section className="dashboard-widget book-widget">
          <h3>Bücher-Statistik</h3>
          <BookStats books={books} />
        </section>
        <section className="dashboard-widget learning-widget">
          <h3>Lern-Statistik</h3>
          <LearningStats />
        </section>
        <section className="dashboard-widget calendar-widget">
          <h3>Kalender</h3>
          <DashboardCalendar />
        </section>
        <section className="dashboard-widget habit-widget">
          <h3>Habits</h3>
          <HabitTracker />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
