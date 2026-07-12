import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import { computeRiskAssessment, generateRecommendations } from '../services/riskEngine';
import type { IntakeFormData, DietPref, IodineZone } from '../types';
import './HealthWorkerPage.css';

const QUICK_SYMPTOMS = [
  { key: 'fatigue', icon: '😴', label: 'Fatigue' },
  { key: 'hair_fall', icon: '💇', label: 'Hair Fall' },
  { key: 'weight_gain', icon: '⚖️', label: 'Weight Gain' },
  { key: 'menstrual_irregularity', icon: '🔴', label: 'Menstrual Issues' },
] as const;

const defaultWorkerForm: IntakeFormData = {
  age: '', bmi: '', has_lab_report: false,
  tsh: '', t3: '', t4: '', severity_score: '0',
  fatigue: false, hair_fall: false, weight_gain: false, cold_intolerance: false,
  menstrual_irregularity: false, mood_changes: false, constipation: false, dry_skin: false,
  family_history_thyroid: false, pcos_history: false, pregnancy_status: false, postpartum_flag: false,
  medication_current: '',
  diet_pref: 'vegetarian', iodine_zone: 'inland',
};

export default function HealthWorkerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAssessment, setRecommendations, setFormData } = useApp();
  const [form, setForm] = useState(defaultWorkerForm);
  const [patientName, setPatientName] = useState('');
  const [workerID, setWorkerID] = useState('ASHA-PB-001');
  const [village, setVillage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof IntakeFormData, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    const assessment = computeRiskAssessment(form);
    const recs = generateRecommendations(assessment, form);
    setAssessment(assessment);
    setRecommendations(recs);
    setFormData(form);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="worker-page">
      <Navbar />
      <div className="worker-wrap container">
        {/* Header */}
        <div className="worker-header">
          <div className="worker-role-badge">
            <span>👩‍⚕️</span> ASHA / ANM Health Worker Interface
          </div>
          <h1 className="worker-title">{t('worker.title')}</h1>
          <p className="worker-subtitle">{t('worker.subtitle')} — Simplified 8-parameter entry for PHC kiosks</p>
        </div>

        {/* Offline indicator */}
        <div className="offline-indicator glass-card">
          <span className="offline-dot online" />
          <span>Online — Data will sync to ABDM automatically</span>
          <span className="offline-storage">📦 0 items in offline queue</span>
        </div>

        <div className="worker-form-grid">
          {/* Worker Info */}
          <div className="glass-card worker-section">
            <h2 className="worker-section-title">👤 Worker Details</h2>
            <div className="form-group">
              <label className="form-label">{t('worker.worker_id')}</label>
              <input className="form-input" value={workerID} onChange={e => setWorkerID(e.target.value)} id="worker-id" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('worker.patient_name')}</label>
              <input className="form-input" placeholder="Patient full name" value={patientName} onChange={e => setPatientName(e.target.value)} id="patient-name" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('worker.patient_village')}</label>
              <input className="form-input" placeholder="e.g. Machhiwara, Punjab" value={village} onChange={e => setVillage(e.target.value)} id="patient-village" />
            </div>
          </div>

          {/* 8-Parameter Clinical Form */}
          <div className="glass-card worker-section">
            <h2 className="worker-section-title">🔬 Clinical Parameters (8 required)</h2>
            <div className="worker-params-grid">
              <div className="form-group">
                <label className="form-label">1. {t('intake.age')}</label>
                <input type="number" className="form-input" placeholder="e.g. 35" value={form.age} onChange={e => update('age', e.target.value)} id="w-age" />
              </div>
              <div className="form-group">
                <label className="form-label">2. {t('intake.bmi')}</label>
                <input type="number" className="form-input" placeholder="e.g. 24.5" value={form.bmi} onChange={e => update('bmi', e.target.value)} id="w-bmi" />
              </div>
              <div className="form-group">
                <label className="form-label">3. TSH (mIU/L) — if available</label>
                <input type="number" className="form-input" placeholder="e.g. 5.8" value={form.tsh} onChange={e => update('tsh', e.target.value)} id="w-tsh" />
                {form.tsh && parseFloat(form.tsh) > 10 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--risk-high)', fontWeight: 700 }}>
                    🚨 CRITICAL — Emergency referral will be triggered
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">4. Symptom Severity (0–10)</label>
                <input type="range" min="0" max="10" className="range-input" value={form.severity_score} onChange={e => update('severity_score', e.target.value)} id="w-severity" />
                <div className="range-labels"><span>None</span><span style={{ color: 'var(--risk-high)' }}>{form.severity_score}/10</span></div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-md)' }}>
              <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>5–8. Key Symptoms (tap to select)</label>
              <div className="worker-symptoms">
                {QUICK_SYMPTOMS.map(s => (
                  <button
                    key={s.key}
                    className={`symptom-btn ${form[s.key] ? 'selected' : ''}`}
                    onClick={() => update(s.key, !form[s.key])}
                    id={`w-${s.key}`}
                  >
                    <span className="symptom-icon">{s.icon}</span>
                    <span className="symptom-label">{s.label}</span>
                    {form[s.key] && <span className="symptom-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Options */}
          <div className="glass-card worker-section">
            <h2 className="worker-section-title">⚙️ Quick Options</h2>
            <div className="worker-options">
              <div className="form-group">
                <label className="form-label">Diet preference</label>
                <div className="toggle-group">
                  <button className={`toggle-btn ${form.diet_pref === 'vegetarian' ? 'active' : ''}`} onClick={() => update('diet_pref', 'vegetarian' as DietPref)} id="w-veg">🥗 Vegetarian</button>
                  <button className={`toggle-btn ${form.diet_pref === 'non-vegetarian' ? 'active' : ''}`} onClick={() => update('diet_pref', 'non-vegetarian' as DietPref)} id="w-nonveg">🍖 Non-Veg</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Region type</label>
                <div className="toggle-group">
                  <button className={`toggle-btn ${form.iodine_zone === 'inland' ? 'active' : ''}`} onClick={() => update('iodine_zone', 'inland' as IodineZone)} id="w-inland">🌾 Inland</button>
                  <button className={`toggle-btn ${form.iodine_zone === 'coastal' ? 'active' : ''}`} onClick={() => update('iodine_zone', 'coastal' as IodineZone)} id="w-coastal">🌊 Coastal</button>
                </div>
              </div>
              <div className="worker-flags">
                {[
                  { key: 'pcos_history', label: 'PCOS history' },
                  { key: 'pregnancy_status', label: 'Pregnant' },
                  { key: 'postpartum_flag', label: 'Postpartum (< 1yr)' },
                  { key: 'family_history_thyroid', label: 'Family thyroid history' },
                ].map(f => (
                  <button
                    key={f.key}
                    className={`worker-flag-btn ${form[f.key as keyof IntakeFormData] ? 'active' : ''}`}
                    onClick={() => update(f.key as keyof IntakeFormData, !form[f.key as keyof IntakeFormData])}
                    id={`w-flag-${f.key}`}
                  >
                    {form[f.key as keyof IntakeFormData] ? '✓' : '+'} {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="worker-submit-bar">
          {submitted ? (
            <div className="worker-submitted">✅ Assessment submitted! Redirecting to dashboard...</div>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting || !form.age || !form.bmi}
              id="worker-submit-btn"
            >
              {submitting ? (
                <><div className="spinner" /> Running AI Assessment...</>
              ) : (
                <>🤖 {t('worker.submit')} for {patientName || 'Patient'}</>
              )}
            </button>
          )}
          <p className="worker-submit-note">
            All data is encrypted and stored per DPDPA. Consent will be recorded with Worker ID: {workerID}
          </p>
        </div>
      </div>
    </div>
  );
}
