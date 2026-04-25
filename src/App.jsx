import { Routes, Route, Navigate } from 'react-router-dom';
import TriageDashboard from './components/TriageDashboard';
import LoginPage from './components/LoginPage';
import HelpProvider from './components/HelpProvider';
import HelpProviderAuth from './components/HelpProviderAuth';
import HelperDashboard from './components/HelperDashboard';
import './App.css';

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/triage" element={<TriageDashboard />} />
        <Route path="/help-provider" element={<HelpProvider />} />
        <Route path="/helper-auth" element={<HelpProviderAuth />} />
        <Route path="/helper-dashboard" element={<HelperDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
