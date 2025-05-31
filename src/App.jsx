import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Home from './components/Home';
import MeetingPage from './components/MeetingPage';

const App = () => {
  const socketRef = useRef();
  const [socketInitialized, setSocketInitialized] = useState(false);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    setSocketInitialized(true);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {socketInitialized && (
          <Route
            path="/meeting/:roomId"
            element={<MeetingPage socket={socketRef.current} />}
          />
        )}
      </Routes>
    </Router>
  );
};

export default App;
