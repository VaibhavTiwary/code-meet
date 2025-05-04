// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import MeetingPage from './components/MeetingPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meeting/:roomId" element={<MeetingPage />} />
      </Routes>

    </Router>
  );
};

export default App;
