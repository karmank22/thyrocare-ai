import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import { generateExplanation } from '../services/riskEngine';
import { API_BASE_URL } from '../config';

import HealthStatusSummary from '../components/dashboard/HealthStatusSummary';
import PersonalizedRecommendations from '../components/dashboard/PersonalizedRecommendations';
import GenAIExplanation from '../components/dashboard/GenAIExplanation';

import './AssessmentDetailsPage.css';

export default function AssessmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [assessment, setAssessment] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [rawData, setRawData] = useState<any>(null);
  const [createdAt, setCreatedAt] = useState('');
  const [modelVersion, setModelVersion] = useState('');

  useEffect(() => {
    const fetchAssessment = async () => {
      const token = localStorage.getItem('thyrocare_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const report = await res.json();
          
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
          setRawData(report);
          setCreatedAt(report.created_at);
          setModelVersion(report.model_version);

          const tsh = parseFloat(report.tsh?.toString() || '5.8');
          const text = generateExplanation(fetchedAssessment, language, tsh);
          setExplanation(text);
          
        } else if (res.status === 404) {
          setError('Assessment not found or you do not have permission to view it.');
        } else {
          setError('Failed to load assessment details.');
        }
      } catch (e) {
        console.error("Error fetching assessment details", e);
        setError('A network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate, language]);

  if (loading) {
    return (
      <div className="assessment-details-page">
        <Navbar />
        <div className="container" style={{ marginTop: 'var(--space-2xl)' }}>
           <div className="skeleton skeleton-text" style={{ width: '300px', height: '40px', marginBottom: '32px' }}></div>
           <div className="dashboard-grid">
             <div className="dashboard-row-top">
               <div className="skeleton glass-card" style={{ height: '200px', flex: 1 }}></div>
               <div className="skeleton glass-card" style={{ height: '200px', flex: 1.5 }}></div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="assessment-details-page">
        <Navbar />
        <div className="container" style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🚫</div>
            <h2>Error</h2>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }} onClick={() => navigate('/history')}>
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="assessment-details-page">
      <Navbar />
      <div className="container" style={{ marginTop: 'var(--space-2xl)', paddingBottom: 'var(--space-2xl)' }}>
        
        <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/history')}>
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Assessment Details</h1>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Date & Time</span>
            <strong style={{ fontSize: '18px' }}>{formatDateTime(createdAt)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Report Name</span>
            <strong style={{ fontSize: '18px' }}>Manual Screening</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>AI Engine</span>
            <strong style={{ fontSize: '18px' }}>{modelVersion}</strong>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ marginBottom: '16px' }}>Extracted Lab Values</h3>
          <div className="lab-values-grid">
            <div className="lab-value-box">
              <span className="lab-label">Age</span>
              <span className="lab-val">{rawData?.age || '-'}</span>
            </div>
            <div className="lab-value-box">
              <span className="lab-label">BMI</span>
              <span className="lab-val">{rawData?.bmi || '-'}</span>
            </div>
            <div className="lab-value-box">
              <span className="lab-label">TSH</span>
              <span className="lab-val">{rawData?.tsh || '-'} mIU/L</span>
            </div>
            <div className="lab-value-box">
              <span className="lab-label">T3</span>
              <span className="lab-val">{rawData?.t3 || '-'} ng/dL</span>
            </div>
            <div className="lab-value-box">
              <span className="lab-label">T4</span>
              <span className="lab-val">{rawData?.t4 || '-'} µg/dL</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-row-top">
            <HealthStatusSummary assessment={assessment} />
            <GenAIExplanation explanation={explanation} language={language} riskClass={assessment.risk_class} />
          </div>
          <div className="dashboard-row-mid" style={{ display: 'block' }}>
            <PersonalizedRecommendations recommendations={recommendations} />
          </div>
        </div>
        
      </div>
    </div>
  );
}
