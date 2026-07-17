import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import './LandingPage.css';

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="stat-card glass-card">
    <div className="stat-value gradient-text">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) => (
  <div className="feature-card glass-card animate-fadeInUp" style={{ animationDelay: `${delay}ms` }}>
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{desc}</p>
  </div>
);

export default function LandingPage() {
  const { t } = useTranslation();
  const { currentUser } = useApp();

  const features = [
    { icon: '📋', key: '1' },
    { icon: '🔬', key: '2' },
    { icon: '🤖', key: '3' },
    { icon: '🥗', key: '4' },
    { icon: '💬', key: '5' },
    { icon: '🏥', key: '6' },
  ];

  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        {/* Animated background orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="container hero-content">
          <div className="hero-badge animate-fadeIn">
            <span className="hero-badge-dot" />
            AI-Powered · Multilingual · Offline-Ready · ABDM Integrated
          </div>

          <h1 className="hero-title animate-fadeInUp">
            {t('landing.hero_title')} <br />
            <span className="gradient-text">{t('landing.hero_title2')}</span>
          </h1>

          <p className="hero-subtitle animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            {t('landing.hero_subtitle')}
          </p>

          <div className="hero-cta animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            <Link to={currentUser?.role === 'worker' ? '/worker' : '/screening'} className="btn btn-primary btn-lg" id="hero-start-screening">
              {t('landing.start_screening')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link to={currentUser?.role === 'worker' ? '/worker/history' : '/dashboard'} className="btn btn-secondary btn-lg" id="hero-view-demo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              {currentUser?.role === 'worker' ? 'View Assessment History' : 'View Demo Dashboard'}
            </Link>
          </div>

          {/* Trust badges */}
          <div className="trust-badges animate-fadeIn" style={{ animationDelay: '300ms' }}>
            <span className="trust-badge">🔒 DPDPA Compliant</span>
            <span className="trust-badge">🏥 ABDM Integrated</span>
            <span className="trust-badge">🇮🇳 NHM Aligned</span>
            <span className="trust-badge">🤖 94.2% AI Accuracy</span>
          </div>
        </div>

        {/* Floating dashboard preview card */}
        <div className="hero-preview animate-float">
          <div className="hero-preview-card glass-card">
            <div className="preview-header">
              <div className="preview-risk-badge risk-badge risk-badge-mild">Mild Risk</div>
              <span className="preview-date">TSH: 5.3 mIU/L</span>
            </div>
            <div className="preview-metrics">
              <div className="preview-metric">
                <span className="preview-metric-label">RF Confidence</span>
                <span className="preview-metric-value">89.4%</span>
              </div>
              <div className="preview-metric">
                <span className="preview-metric-label">XGB Confidence</span>
                <span className="preview-metric-value">87.1%</span>
              </div>
              <div className="preview-metric">
                <span className="preview-metric-label">Ensemble</span>
                <span className="preview-metric-value">88.4%</span>
              </div>
            </div>
            <div className="preview-recommendation">
              <span className="preview-rec-icon">🌾</span>
              Use double-fortified iodized salt. Add moringa leaves to daily diet.
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid stagger-children">
            <StatCard value={t('landing.stats_1_value')} label={t('landing.stats_1_label')} />
            <StatCard value={t('landing.stats_2_value')} label={t('landing.stats_2_label')} />
            <StatCard value={t('landing.stats_3_value')} label={t('landing.stats_3_label')} />
            <StatCard value={t('landing.stats_4_value')} label={t('landing.stats_4_label')} />
          </div>
        </div>
      </section>

      {/* Six Layers */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">{t('landing.features_title')}</span>
            <h2 className="section-title">
              From Data Capture to <span className="gradient-text">Personalized Guidance</span>
            </h2>
            <p className="section-subtitle">
              ThyroCare-AI processes your information through six intelligent layers — 
              each building on the last — to deliver clinically grounded, personalized, multilingual guidance.
            </p>
          </div>
          <div className="features-grid grid stagger-children">
            {features.map((f, i) => (
              <FeatureCard
                key={f.key}
                icon={f.icon}
                title={t(`landing.feature_${f.key}_title`)}
                desc={t(`landing.feature_${f.key}_desc`)}
                delay={i * 80}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">How It Works</span>
            <h2 className="section-title">Your <span className="gradient-text">7-Step Journey</span></h2>
          </div>
          <div className="steps-list">
            {[
              { step: '01', title: 'Choose Your Language', desc: 'Select from Hindi, Tamil, Bengali, Telugu, Marathi, or English.' },
              { step: '02', title: 'Enter Basic Details', desc: 'Age, BMI — just two fields to start. Progressive disclosure shows only what\'s needed.' },
              { step: '03', title: 'Upload Lab Report (Optional)', desc: 'PDF or image of your thyroid report. AI extracts TSH, T3, T4 automatically.' },
              { step: '04', title: 'Select Symptoms', desc: 'Tap picture icons for fatigue, hair fall, weight gain, and 5 other common symptoms.' },
              { step: '05', title: 'AI Risk Assessment', desc: 'Random Forest + XGBoost ensemble predicts Normal / Mild / Moderate / High in seconds.' },
              { step: '06', title: 'Get Recommendations', desc: 'Diet, yoga, lifestyle, and follow-up schedule personalized to your region and symptoms.' },
              { step: '07', title: 'Connect to Care', desc: 'For moderate/high risk: book a free e-Sanjeevani consult or find the nearest PMJAY hospital.' },
            ].map((s, i) => (
              <div key={i} className="step-item animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="step-number">{s.step}</div>
                <div className="step-content">
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="personas-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Who It's For</span>
            <h2 className="section-title">Designed for <span className="gradient-text">Every User</span></h2>
          </div>
          <div className="personas-grid grid grid-2">
            {[
              { icon: '👩', title: 'Rural Woman Patient', desc: 'Understands her lab report in her language. Gets diet and lifestyle guidance. Knows when to see a doctor.', tag: 'Primary User' },
              { icon: '👩‍⚕️', title: 'ASHA / ANM Health Worker', desc: 'Simplified 8-parameter data entry at PHC kiosks. Works offline. Clear escalation guidance.', tag: 'PHC Tier 3' },
              { icon: '🏥', title: 'PHC / CHC Clinician', desc: 'Risk-stratified patient list. Referral pathway to specialists. Trend history.', tag: 'Tier 2 & 3' },
              { icon: '👨‍⚕️', title: 'Endocrinologist', desc: 'Concise clinical summary, full lab history, AI risk rationale via SHAP values.', tag: 'Metro Tier 1' },
            ].map((p, i) => (
              <div key={i} className="persona-card glass-card">
                <div className="persona-icon">{p.icon}</div>
                <div className="persona-body">
                  <div className="persona-header">
                    <h3 className="persona-title">{p.title}</h3>
                    <span className="tag">{p.tag}</span>
                  </div>
                  <p className="persona-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* National Integration */}
      <section className="integrations-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">National Health Integration</span>
            <h2 className="section-title">Connected to <span className="gradient-text">India's Health Stack</span></h2>
          </div>
          <div className="integrations-grid">
            {[
              { name: 'ABDM', desc: 'FHIR R4 health records sync', icon: '🔗' },
              { name: 'e-Sanjeevani', desc: 'NHM telemedicine platform', icon: '📞' },
              { name: 'PMJAY', desc: 'Hospital empanelment lookup', icon: '🏥' },
              { name: 'NHM 104', desc: 'Emergency helpline escalation', icon: '🚨' },
              { name: 'ICMR Guidelines', desc: 'Clinical reference standards', icon: '📋' },
              { name: 'AYUSH', desc: 'Yoga & lifestyle protocols', icon: '🧘' },
            ].map((integ, i) => (
              <div key={i} className="integ-card glass-card">
                <span className="integ-icon">{integ.icon}</span>
                <div>
                  <div className="integ-name">{integ.name}</div>
                  <div className="integ-desc">{integ.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <div className="cta-orb" />
            <h2 className="cta-title">{t('landing.cta_title')}</h2>
            <p className="cta-subtitle">{t('landing.cta_subtitle')}</p>
            <Link to={currentUser?.role === 'worker' ? '/worker' : '/screening'} className="btn btn-primary btn-lg" id="cta-start-screening">
              {t('landing.start_screening')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <div className="cta-languages">
              <span>Available in:</span>
              {['हिंदी', 'தமிழ்', 'বাংলা', 'తెలుగు', 'मराठी', 'English'].map(l => (
                <span key={l} className="tag">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-logo">
            <span className="navbar-logo-text">ThyroCare</span><span className="navbar-logo-ai">-AI</span>
          </div>
          <p className="footer-text">
            Research platform by Karman & Dr. Harvinder Singh — Amity University Punjab. <br />
            Not a substitute for professional medical advice. Always consult a licensed physician.
          </p>
          <div className="footer-tags">
            <span className="tag">SDG 3.4</span>
            <span className="tag">SDG 3.8</span>
            <span className="tag">SDG 5.b</span>
            <span className="tag">SDG 9.c</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
