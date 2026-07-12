import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import './LoginPage.css';

type LoginRole = 'patient' | 'worker';
type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();

  const [activeTab, setActiveTab] = useState<LoginRole>('patient');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [preferredName, setPreferredName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback translation if not available in i18n
  const texts = {
    patientTab: t('login.patientTab', 'Patient Portal'),
    workerTab: t('login.workerTab', 'ASHA Worker Portal'),
    patientId: t('login.patientId', 'Username / Patient ID'),
    workerId: t('login.workerId', 'Worker ID / Username'),
    password: t('login.password', 'Password'),
    preferredName: t('login.preferredName', 'Preferred Name'),
    submitLogin: t('login.submit', 'Sign In'),
    submitRegister: t('login.register', 'Create Account'),
    welcome: t('login.welcome', 'Welcome Back'),
    createTitle: t('login.createTitle', 'Create an Account'),
    subtitle: t('login.subtitle', 'Please log in to access your dashboard and records.')
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (authMode === 'register' && !preferredName) return;

    setLoading(true);
    setErrorMsg('');

    try {
      if (authMode === 'register') {
        const res = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            preferred_name: preferredName,
            role: activeTab
          })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Registration failed");
        }
        
        // Auto login after register
        await authenticate(username, password);
      } else {
        await authenticate(username, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const authenticate = async (user: string, pass: string) => {
    const formData = new URLSearchParams();
    formData.append('username', user);
    formData.append('password', pass);

    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Login failed");
    }

    const data = await res.json();
    login(data.user, data.access_token);
    
    // Redirect
    const from = (location.state as any)?.from?.pathname || (activeTab === 'patient' ? '/dashboard' : '/worker');
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="login-title">
            {authMode === 'login' ? texts.welcome : texts.createTitle}
          </h1>
          {authMode === 'login' && <p className="login-subtitle">{texts.subtitle}</p>}
        </div>

        <div className="glass-card login-card">
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${activeTab === 'patient' ? 'active' : ''}`}
              onClick={() => setActiveTab('patient')}
            >
              {texts.patientTab}
            </button>
            <button
              type="button"
              className={`login-tab ${activeTab === 'worker' ? 'active' : ''}`}
              onClick={() => setActiveTab('worker')}
            >
              {texts.workerTab}
            </button>
          </div>

          <div style={{ padding: '0 var(--space-xl)', marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <button 
                type="button"
                style={{ fontWeight: authMode === 'login' ? 'bold' : 'normal', color: authMode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)' }}
                onClick={() => setAuthMode('login')}
              >Sign In</button>
              <button 
                type="button"
                style={{ fontWeight: authMode === 'register' ? 'bold' : 'normal', color: authMode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)' }}
                onClick={() => setAuthMode('register')}
              >Create Account</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {errorMsg && (
              <div className="field-error form-alert-danger" style={{ padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {activeTab === 'patient' ? texts.patientId : texts.workerId}
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeTab === 'patient' ? "e.g. johndoe" : "e.g. ashaworker1"}
                required
              />
            </div>

            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">{texts.preferredName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="e.g. Priya"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{texts.password}</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {authMode === 'login' && (
              <div className="login-meta">
                <label className="login-remember">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button type="button" className="login-forgot">Forgot Password?</button>
              </div>
            )}

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? (
                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : (authMode === 'login' ? texts.submitLogin : texts.submitRegister)}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}
