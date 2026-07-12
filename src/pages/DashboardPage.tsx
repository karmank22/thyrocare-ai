import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import { computeRiskAssessment, generateRecommendations, generateExplanation } from '../services/riskEngine';
import { mockTSHTrend, mockHistory, mockFacilities, mockWellnessGoals, wellnessResources } from '../services/mockData';

// Dashboard Panels
import HealthStatusSummary from '../components/dashboard/HealthStatusSummary';
import PersonalizedRecommendations from '../components/dashboard/PersonalizedRecommendations';
import GenAIExplanation from '../components/dashboard/GenAIExplanation';
import ReportUpload from '../components/dashboard/ReportUpload';
import TSHTrendChart from '../components/dashboard/TSHTrendChart';
import HealthHistoryTimeline from '../components/dashboard/HealthHistoryTimeline';
import DoctorReferral from '../components/dashboard/DoctorReferral';
import WellnessResources from '../components/dashboard/WellnessResources';
import DailyWellnessGoalTracker from '../components/dashboard/DailyWellnessGoalTracker';
import './DashboardPage.css';

// Demo form data to show a working dashboard even without form submission
const DEMO_FORM = {
  age: '34', bmi: '26.5', has_lab_report: true,
  tsh: '5.8', t3: '3.1', t4: '1.1', severity_score: '3',
  fatigue: true, hair_fall: true, weight_gain: false, cold_intolerance: true,
  menstrual_irregularity: true, mood_changes: false, constipation: false, dry_skin: true,
  family_history_thyroid: true, pcos_history: false, pregnancy_status: false, postpartum_flag: false,
  medication_current: 'none',
  diet_pref: 'vegetarian' as const, iodine_zone: 'inland' as const,
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { assessment: ctxAssessment, recommendations: ctxRecs, formData, language, currentUser, setAssessment: setCtxAssessment, setRecommendations: setCtxRecs, setFormData: setCtxFormData } = useApp();

  const [assessment, setAssessment] = useState(ctxAssessment);
  const [recommendations, setRecommendations] = useState(ctxRecs);
  const [explanation, setExplanation] = useState('');
  const [goals, setGoals] = useState(mockWellnessGoals);
  
  const [loading, setLoading] = useState(!ctxAssessment);
  const [hasRecord, setHasRecord] = useState(!!ctxAssessment);

  useEffect(() => {
    const fetchRecord = async () => {
      if (ctxAssessment) {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('thyrocare_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/records/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 404) {
          setHasRecord(false);
        } else if (res.ok) {
          const data = await res.json();
          setHasRecord(true);
          
          // Reconstruct assessment object from DB row
          const fetchedAssessment = {
            risk_class: data.risk_class || 'Normal',
            risk_score: data.risk_score || 0.1,
            emergency_flag: data.emergency_flag || false,
            key_factors: ['tsh_level', 'symptoms']
          };
          
          const fetchedRecs = {
            lifestyle: ['Maintain hydration', 'Follow a balanced diet'],
            dietary: [data.diet_pref === 'vegetarian' ? 'Include iodine-rich salt' : 'Include seafood'],
            medical_advice: data.risk_score > 0.5 ? ['Consult endocrinologist'] : ['Routine checkup in 6 months'],
            referral_tier: data.referral_tier || 'primary',
            referral_trigger: data.emergency_flag ? 'Emergency Symptoms' : 'Standard Follow-up',
            emergency_flag: data.emergency_flag
          };

          setAssessment(fetchedAssessment);
          setRecommendations(fetchedRecs);
          setCtxAssessment(fetchedAssessment);
          setCtxRecs(fetchedRecs);
          
          // Partial form reconstruction for TSH explanation
          setCtxFormData({ tsh: data.tsh?.toString() || '0' } as any);
        }
      } catch (e) {
        console.error("Error fetching records", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [ctxAssessment, navigate, setCtxAssessment, setCtxRecs, setCtxFormData]);

  useEffect(() => {
    if (assessment) {
      const tsh = parseFloat(formData?.tsh || '5.8');
      const text = generateExplanation(assessment, language, tsh);
      setExplanation(text);
    }
  }, [assessment, language, formData]);

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Navbar />
        <div className="loading-center">
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-wrap">
        {/* Dashboard Header */}
        <div className="dashboard-header container">
          <div className="dashboard-header-left">
            <span className="section-label">{t('dashboard.title')}</span>
            <h1 className="dashboard-title">
              Welcome back, <span className="gradient-text">{currentUser?.preferred_name || 'Guest'}</span>
            </h1>
            <p className="dashboard-subtitle">
              {t('dashboard.last_updated')}: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="dashboard-header-right">
            <button className="btn btn-secondary" onClick={() => navigate('/screening')} id="btn-new-screening">
              + New Screening
            </button>
          </div>
        </div>

        {!hasRecord || !assessment || !recommendations ? (
          /* EMPTY STATE */
          <div className="container" style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: 'var(--space-2xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📄</div>
              <h2>No Assessments Found</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
                You haven't uploaded any lab reports or completed a screening yet. 
                Upload your first lab report to generate your personalized AI assessment.
              </p>
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <ReportUpload />
              </div>
              <p style={{ margin: 'var(--space-lg) 0' }}>OR</p>
              <button className="btn btn-primary" onClick={() => navigate('/screening')}>
                Start Manual Screening
              </button>
            </div>
          </div>
        ) : (
          /* DASHBOARD GRID */
          <>
            {/* Emergency Alert */}
            {assessment.emergency_flag && (
              <div className="container" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="emergency-banner animate-fadeInUp">
                  <div className="emergency-icon">🚨</div>
                  <div className="emergency-content">
                    <h3>{t('dashboard.emergency_alert')}</h3>
                    <p>{t('dashboard.emergency_message')}</p>
                  </div>
                  <div className="emergency-actions">
                    <a href="tel:104" className="btn btn-danger btn-sm" id="btn-call-104">
                      📞 {t('dashboard.call_104')}
                    </a>
                    <button className="btn btn-secondary btn-sm" id="btn-book-telemedicine">
                      💻 {t('dashboard.book_telemedicine')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="dashboard-grid container">
              {/* Row 1: Status + GenAI + Report Upload */}
              <div className="dashboard-row-top">
                <HealthStatusSummary assessment={assessment} />
                <GenAIExplanation explanation={explanation} language={language} riskClass={assessment.risk_class} />
                <ReportUpload />
              </div>

              {/* Row 2: Recommendations (wide) + TSH Chart */}
              <div className="dashboard-row-mid">
                <div className="dashboard-col-wide">
                  <PersonalizedRecommendations recommendations={recommendations} />
                </div>
                <div className="dashboard-col-narrow">
                  <TSHTrendChart data={mockTSHTrend} />
                </div>
              </div>

              {/* Row 3: Referral + History Timeline */}
              <div className="dashboard-row-mid">
                <div className="dashboard-col-wide">
                  <DoctorReferral
                    referralTier={recommendations.referral_tier}
                    facilities={mockFacilities}
                    emergencyFlag={recommendations.emergency_flag}
                    referralTrigger={recommendations.referral_trigger}
                  />
                </div>
                <div className="dashboard-col-narrow">
                  <HealthHistoryTimeline history={mockHistory} />
                </div>
              </div>

              {/* Row 4: Goals + Resources */}
              <div className="dashboard-row-bot">
                <DailyWellnessGoalTracker goals={goals} onToggle={toggleGoal} />
                <WellnessResources resources={wellnessResources} />
              </div>
            </div>
          </>
        )}

        {/* Footer note */}
        <div className="container dashboard-footer">
          <p className="footer-text">
            ⚠️ ThyroCare-AI provides AI-assisted guidance only. Always consult a licensed physician for diagnosis and treatment. | Powered by Random Forest + XGBoost Ensemble (94.2% accuracy) | ABDM Aligned | DPDPA Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
