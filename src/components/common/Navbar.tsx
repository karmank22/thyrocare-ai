import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';
import { LANGUAGES } from '../../i18n';
import './Navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  const { language, switchLanguage, theme, toggleTheme, currentUser, logout } = useApp();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const isLight = theme === 'light';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <span className="navbar-logo-text">ThyroCare</span>
            <span className="navbar-logo-ai">-AI</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
            {t('nav.home')}
          </Link>
          {currentUser?.role === 'patient' && (
            <>
              <Link to="/screening" className={`navbar-link ${isActive('/screening') ? 'active' : ''}`}>
                {t('nav.screening')}
              </Link>
              <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                {t('nav.dashboard')}
              </Link>
              <Link to="/history" className={`navbar-link ${isActive('/history') ? 'active' : ''}`}>
                History
              </Link>
              <Link to="/profile" className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          )}
          {currentUser?.role === 'worker' && (
            <>
              <Link to="/worker" className={`navbar-link ${isActive('/worker') ? 'active' : ''}`}>
                New Screening
              </Link>
              <Link to="/worker/history" className={`navbar-link ${isActive('/worker/history') ? 'active' : ''}`}>
                Assessment History
              </Link>
              <Link to="/profile" className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* ── Theme Toggle ── */}
          <button
            className={`theme-toggle ${isLight ? 'theme-toggle-light' : 'theme-toggle-dark'}`}
            onClick={toggleTheme}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to day mode'}
            id="theme-toggle-btn"
            title={isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">
                {isLight ? (
                  /* Sun icon */
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  /* Moon icon */
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </span>
            </span>
            <span className="theme-toggle-label">
              {isLight ? 'Day' : 'Night'}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="lang-switcher" ref={dropRef}>
            <button
              className="lang-btn"
              onClick={() => setLangOpen(!langOpen)}
              aria-label="Switch language"
              id="lang-switcher-btn"
            >
              <span>{currentLang.flag}</span>
              <span className="lang-native">{currentLang.nativeName}</span>
              <svg className={`lang-chevron ${langOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {langOpen && (
              <div className="lang-dropdown animate-fadeIn">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`lang-option ${language === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      switchLanguage(lang.code as typeof language);
                      setLangOpen(false);
                    }}
                    id={`lang-option-${lang.code}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="lang-option-name">{lang.name}</span>
                    {language === lang.code && (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{marginLeft:'auto', color:'var(--text-accent)'}}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          {!currentUser ? (
            <Link to="/login" className="btn btn-primary btn-sm navbar-cta">
              {t('nav.login', 'Login')}
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Account actions moved to Profile page */}
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-btn"
          >
            <span/><span/><span/>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu animate-fadeIn">
          <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>{t('nav.home')}</Link>
          {currentUser?.role === 'patient' && (
            <>
              <Link to="/screening" className="mobile-link" onClick={() => setMobileOpen(false)}>{t('nav.screening')}</Link>
              <Link to="/dashboard" className="mobile-link" onClick={() => setMobileOpen(false)}>{t('nav.dashboard')}</Link>
              <Link to="/history" className="mobile-link" onClick={() => setMobileOpen(false)}>{t('nav.history', 'History')}</Link>
            </>
          )}
          {currentUser?.role === 'worker' && (
            <Link to="/worker" className="mobile-link" onClick={() => setMobileOpen(false)}>{t('nav.worker', 'Worker Portal')}</Link>
          )}
          {!currentUser ? (
            <Link to="/login" className="mobile-link" style={{ color: 'var(--text-accent)' }} onClick={() => setMobileOpen(false)}>{t('nav.login', 'Login')}</Link>
          ) : (
            <Link to="/profile" className="mobile-link" onClick={() => setMobileOpen(false)}>Profile</Link>
          )}

          {/* Mobile theme toggle */}
          <button
            className={`mobile-theme-btn ${isLight ? 'mobile-theme-light' : 'mobile-theme-dark'}`}
            onClick={() => { toggleTheme(); setMobileOpen(false); }}
            id="mobile-theme-btn"
          >
            {isLight ? '🌙 Switch to Night Mode' : '☀️ Switch to Day Mode'}
          </button>

          <div className="mobile-langs">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`mobile-lang-btn ${language === lang.code ? 'active' : ''}`}
                onClick={() => { switchLanguage(lang.code as typeof language); setMobileOpen(false); }}
              >
                {lang.flag} {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
