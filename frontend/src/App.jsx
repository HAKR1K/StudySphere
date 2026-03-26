import { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './Dashboard';

function App() {
  // Initialize state from LocalStorage if it exists
  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem('study_sphere_subjects');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to LocalStorage whenever subjects change
  useEffect(() => {
    localStorage.setItem('study_sphere_subjects', JSON.stringify(subjects));
  }, [subjects]);

  return <Dashboard subjects={subjects} setSubjects={setSubjects} />;
}

export default App;