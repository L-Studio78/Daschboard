import React, { useState } from 'react';
import HabitsOverview from './HabitsOverview';
import HabitDetail from './HabitDetail';
import './HabitTracker.css';

const HabitTracker = () => {
  // Für spätere Detail-Ansicht
  const [selectedHabit, setSelectedHabit] = useState(null);

  return (
    <div className="habit-tracker-glass">
      {selectedHabit ? (
        <HabitDetail habit={selectedHabit} onBack={() => setSelectedHabit(null)} />
      ) : (
        <HabitsOverview onSelectHabit={setSelectedHabit} />
      )}
    </div>
  );
};

export default HabitTracker;