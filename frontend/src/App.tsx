import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Project from './pages/Project';
import Organization from './pages/Organization';
import ShadcnDemo from './components/ShadcnDemo';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/demo" element={<ShadcnDemo />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;