import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL } from '../config';
import { computeRiskAssessment, generateRecommendations, generateExplanation } from '../services/riskEngine';
import { mockFacilities, mockWellnessGoals, wellnessResources } from '../services/mockData';

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
  const [trendData, setTrendData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(!ctxAssessment);
  const [hasRecord, setHasRecord] = useState(!!ctxAssessment);

  useEffect(() => {
    const fetchRecord = async () => {
      if (ctxAssessment && trendData.length > 0) {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('thyrocare_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const [resLatest, resHistory] = await Promise.all([
          fetch(`${API_BASE_URL}/api/assessments/latest`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/assessments/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (resLatest.ok) {
          const data = await resLatest.json();
          if (!data.hasReport || !data.report) {
            setHasRecord(false);
          } else {
            setHasRecord(true);
            const report = data.report;
            
            const fetchedAssessment = {
              risk_class: report.risk_class || 'Normal',
              risk_score: report.risk_score || 0.1,
              emergency_flag: report.emergency_flag || false,
              top_features: report.top_features ? JSON.parse(report.top_features) : []
            };
            
            const fetchedRecs = report.recommendations_json 
              ? JSON.parse(report.recommendations_json) 
              : { diet: [], lifestyle: [], referral_tier: 'none' };

            setAssessment(fetchedAssessment);
            setRecommendations(fetchedRecs);
            setCtxAssessment(fetchedAssessment);
            setCtxRecs(fetchedRecs);
            
            setCtxFormData({ tsh: report.tsh?.toString() || '0' } as any);

            // Process History
            if (resHistory.ok) {
              const historyData = await resHistory.json();
              // Sort chronologically
              const sortedHistory = historyData.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              const mappedTrend = sortedHistory.map((item: any) => ({
                date: new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' }),
                tsh: item.tsh || 0,
                t3: item.t3 || 0,
                t4: item.t4 || 0,
                risk_class: item.risk_class || 'Normal',
              }));
              setTrendData(mappedTrend);
            }
          }
        } else {
          setHasRecord(false);
        }
      } catch (e) {
        console.error("Error fetching assessment", e);
        setHasRecord(false);
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
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-wrap container" style={{ marginTop: 'var(--space-xl)' }}>
          {/* Skeleton Header */}
          <div className="skeleton skeleton-text" style={{ width: '200px', height: '24px', marginBottom: '8px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '300px', height: '40px', marginBottom: '32px' }}></div>
          
          {/* Skeleton Grid */}
          <div className="dashboard-grid">
            <div className="dashboard-row-top">
              <div className="skeleton glass-card" style={{ height: '200px', flex: 1 }}></div>
              <div className="skeleton glass-card" style={{ height: '200px', flex: 1.5 }}></div>
              <div className="skeleton glass-card" style={{ height: '200px', flex: 1 }}></div>
            </div>
            <div className="dashboard-row-mid">
              <div className="skeleton glass-card dashboard-col-wide" style={{ height: '250px' }}></div>
              <div className="skeleton glass-card dashboard-col-narrow" style={{ height: '250px' }}></div>
            </div>
            <div className="dashboard-row-bot">
              <div className="skeleton glass-card" style={{ height: '300px', flex: 1 }}></div>
              <div className="skeleton glass-card" style={{ height: '300px', flex: 1 }}></div>
            </div>
          </div>
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
            {!hasRecord ? (
              <>
                <h1 className="dashboard-title">
                  Welcome, <span className="gradient-text">{currentUser?.preferred_name || 'Guest'}</span>!
                </h1>
                <p className="dashboard-subtitle">
                  We're glad you're here. Upload your first thyroid report to generate your personalized AI assessment.
                </p>
              </>
            ) : (
              <>
                <h1 className="dashboard-title">
                  Welcome back, <span className="gradient-text">{currentUser?.preferred_name || 'Guest'}</span>!
                </h1>
                <p className="dashboard-subtitle">
                  Here's your latest thyroid assessment.
                </p>
                <p className="dashboard-subtitle" style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                  {t('dashboard.last_updated')}: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </>
            )}
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
                  <TSHTrendChart data={trendData} />
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
                  <HealthHistoryTimeline history={[]} />
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
