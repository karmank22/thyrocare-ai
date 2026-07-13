import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import './index.css';
import './components/dashboard/panels.css';

// Pages
import LandingPage from './pages/LandingPage';
import IntakeFormPage from './pages/IntakeFormPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import AssessmentDetailsPage from './pages/AssessmentDetailsPage';
import HealthWorkerPage from './pages/HealthWorkerPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

// Context
import { AppContext } from './contexts/AppContext';
import { API_BASE_URL } from './config';
import type { Theme, User } from './contexts/AppContext';
import type { RiskAssessment, RecommendationSet, IntakeFormData, Language } from './types';

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { currentUser } = React.useContext(AppContext);
  const location = useLocation();

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  const { i18n } = useTranslation();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationSet | null>(null);
  const [formData, setFormData] = useState<IntakeFormData | null>(null);
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('thyrocare_lang') as Language) || 'en'
  );
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem('thyrocare_theme') as Theme) || 'dark'
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Apply/remove 'light' class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('thyrocare_theme', theme);
  }, [theme]);

  // Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('thyrocare_token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setCurrentUser(user);
          } else {
            localStorage.removeItem('thyrocare_token');
          }
        } catch (err) {
          console.error("Auth check failed:", err);
        }
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('thyrocare_lang', lang);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('thyrocare_token', token);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('thyrocare_token');
    // Clear assessment data on logout
    setAssessment(null);
    setRecommendations(null);
    setFormData(null);
  };

  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  return (
    <AppContext.Provider value={{
      assessment, setAssessment,
      recommendations, setRecommendations,
      formData, setFormData,
      language, switchLanguage,
      theme, toggleTheme,
      currentUser, login, logout
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/screening" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <IntakeFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <HistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assessment/:id" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AssessmentDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['patient', 'worker']}>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/worker" 
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <HealthWorkerPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
