import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TaskInput from './pages/TaskInput';
import LandingPage from './pages/LandingPage';

// We use a sub-component so we can access hooks like useLocation
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // This state stores the prediction results from the backend
  const [sprintData, setSprintData] = useState(null);

  // Triggered by buttons on the Landing Page
  const handleStart = () => {
    navigate('/input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Triggered when TaskInput receives data from FastAPI
  const handleAnalysisComplete = (data) => {
    setSprintData(data);
    navigate('/results'); 
  };

  // Determine if we should show the App UI (Navbar/Margins) or the Landing UI
  const isLandingPage = location.pathname === "/" || location.pathname === "";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hide Navbar on the Landing Page */}
      {!isLandingPage && <Navbar />}
      
      {/* If it's the landing page, we use full width (no padding).
          If it's an app page, we use your original max-7xl container.
      */}
      <main className={isLandingPage ? "" : "max-w-7xl mx-auto p-6 lg:p-10"}>
        <Routes>
          {/* Landing Page Route */}
          <Route path="/" element={<LandingPage onStart={handleStart} />} />

          {/* Task Input Route */}
          <Route 
            path="/input" 
            element={<TaskInput onAnalyze={handleAnalysisComplete} />} 
          />

          {/* Dashboard Route - now receiving the 'sprintData' results */}
          <Route 
            path="/results" 
            element={<Dashboard response={sprintData} />} 
          />
           <Route path="*" element={<LandingPage onStart={handleStart} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}