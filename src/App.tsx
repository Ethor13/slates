import { Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/Auth/AuthForm';
import ProtectedRoute from './components/User/ProtectedRoute';
import Dashboard from './components/User/Dashboard';
import Settings from './components/User/Settings';
import SharedDashboard from './components/User/SharedDashboard';
import LandingPage from './components/Landing/LandingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthForm />} />
      <Route path="/shared/:token" element={<SharedDashboard />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute redirectTemp={true}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;