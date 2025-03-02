import { Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/Auth/AuthForm';
import ProtectedRoute from './components/User/ProtectedRoute';
import Dashboard from './components/User/Dashboard';
import LandingPage from './components/Landing/LandingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;