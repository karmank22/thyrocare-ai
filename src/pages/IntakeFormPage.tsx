import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL } from '../config';
import { computeRiskAssessment, generateRecommendations } from '../services/riskEngine';
import type { IntakeFormData, DietPref, IodineZone } from '../types';
import './IntakeFormPage.css';

const TOTAL_STEPS = 5;

const defaultForm: IntakeFormData = {
  age: '', bmi: '', has_lab_report: null,
  tsh: '', t3: '', t4: '', severity_score: '2',
  fatigue: false, hair_fall: false, weight_gain: false, cold_intolerance: false,
  menstrual_irregularity: false, mood_changes: false, constipation: false, dry_skin: false,
  family_history_thyroid: false, pcos_history: false, pregnancy_status: false,
  postpartum_flag: false, medication_current: '',
  diet_pref: 'vegetarian', iodine_zone: 'inland',
};

const SYMPTOMS = [
  { key: 'fatigue', icon: '😴', labelKey: 'intake.fatigue' },
  { key: 'hair_fall', icon: '💇', labelKey: 'intake.hair_fall' },
  { key: 'weight_gain', icon: '⚖️', labelKey: 'intake.weight_gain' },
  { key: 'cold_intolerance', icon: '🥶', labelKey: 'intake.cold_intolerance' },
  { key: 'menstrual_irregularity', icon: '🔴', labelKey: 'intake.menstrual_irregularity' },
  { key: 'mood_changes', icon: '🌀', labelKey: 'intake.mood_changes' },
  { key: 'constipation', icon: '😣', labelKey: 'intake.constipation' },
  { key: 'dry_skin', icon: '🏜️', labelKey: 'intake.dry_skin' },
] as const;

export default function IntakeFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAssessment, setRecommendations, setFormData } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IntakeFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const updateField = (field: keyof IntakeFormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (key: keyof IntakeFormData) => {
    setForm(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Only PDF files are supported");
        return;
      }
      setUploaded('Uploading and extracting...');
      
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('thyrocare_token');
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/upload`, {
          method: 'POST',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: formData,
        });
        
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.detail || 'Failed to process report');
        }
        
        const extracted = data.extracted;
        setUploaded(file.name);
        if (extracted.tsh) updateField('tsh', extracted.tsh.toString());
        if (extracted.t3) updateField('t3', extracted.t3.toString());
        if (extracted.t4) updateField('t4', extracted.t4.toString());
      } catch (err: any) {
         alert(err.message);
         setUploaded('');
      }
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition ||
      (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      // Simple keyword detection
      const lower = transcript.toLowerCase();
      if (lower.includes('थकान') || lower.includes('tired') || lower.includes('fatigue')) {
        updateField('fatigue', true);
      }
      if (lower.includes('बाल') || lower.includes('hair') || lower.includes('fall')) {
        updateField('hair_fall', true);
      }
    };
    recognition.start();
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('thyrocare_token');
      if (token) {
        const payload = {
          ...form,
          age: form.age ? parseFloat(form.age) : null,
          bmi: form.bmi ? parseFloat(form.bmi) : null,
          tsh: form.tsh ? parseFloat(form.tsh) : null,
          t3: form.t3 ? parseFloat(form.t3) : null,
          t4: form.t4 ? parseFloat(form.t4) : null,
          severity_score: form.severity_score ? parseInt(form.severity_score) : null,
        };
        
        const res = await fetch(`${API_BASE_URL}/api/assessments/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          // Clear context to force Dashboard to fetch the latest
          setAssessment(null);
          setRecommendations(null);
          setFormData(null);
        }
      }
    } catch (e) {
      console.error('Failed to save assessment:', e);
    } finally {
      setLoading(false);
      navigate('/dashboard');
    }
  };

  const canProceed = () => {
    if (step === 1) return form.age !== '' && form.bmi !== '' && form.has_lab_report !== null;
    return true;
  };

  return (
    <div className="intake-page">
      <Navbar />
      <div className="intake-wrap">
        {/* Header */}
        <div className="intake-header container">
          <span className="section-label">{t('intake.title')}</span>
          <h1 className="intake-title">{t('intake.subtitle')}</h1>
        </div>

        {/* Progress */}
        <div className="intake-progress container">
          <div className="progress-steps">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <React.Fragment key={i}>
                <div
                  className={`progress-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}
                  onClick={() => i + 1 < step && setStep(i + 1)}
                >
                  {step > i + 1 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : i + 1}
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={`progress-connector ${step > i + 1 ? 'done' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="progress-label">
            {t('intake.step')} {step} {t('intake.of')} {TOTAL_STEPS}: &nbsp;
            <strong>{t(`intake.step${step}_title`)}</strong>
          </div>
          <div className="progress-bar-wrap" style={{ marginTop: '8px' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Form Card */}
        <div className="intake-card glass-card container animate-fadeInUp">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <h2 className="step-section-title">
                🧍 {t('intake.step1_title')}
              </h2>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('intake.age')}</label>
                  <input
                    type="number" min="10" max="100"
                    className="form-input"
                    placeholder="e.g. 32"
                    value={form.age}
                    onChange={e => updateField('age', e.target.value)}
                    onKeyDown={handleNumericKeyDown}
                    id="field-age"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('intake.bmi')}</label>
                  <input
                    type="number" min="10" max="60" step="0.1"
                    className="form-input"
                    placeholder="e.g. 24.5"
                    value={form.bmi}
                    onChange={e => updateField('bmi', e.target.value)}
                    onKeyDown={handleNumericKeyDown}
                    id="field-bmi"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('intake.has_lab_report')}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle-btn ${form.has_lab_report === true ? 'active' : ''}`}
                    onClick={() => updateField('has_lab_report', true)}
                    id="toggle-has-report-yes"
                  >
                    ✅ {t('intake.yes')}
                  </button>
                  <button
                    className={`toggle-btn ${form.has_lab_report === false ? 'active' : ''}`}
                    onClick={() => updateField('has_lab_report', false)}
                    id="toggle-has-report-no"
                  >
                    ❌ {t('intake.no')}
                  </button>
                </div>
              </div>

              {form.has_lab_report === true && (
                <div className="upload-zone animate-fadeIn" onClick={() => fileRef.current?.click()}>
                  <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileUpload} />
                  {uploaded ? (
                    <div className="upload-success">
                      <span>✅</span>
                      <div>
                        <div className="upload-filename">{uploaded}</div>
                        <div className="upload-note">AI extracted: TSH={form.tsh}, T3={form.t3}, T4={form.t4}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="upload-icon">📄</div>
                      <div className="upload-title">{t('intake.upload_report')}</div>
                      <div className="upload-subtitle">PDF, JPG, PNG — Click or drag & drop</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Lab Values */}
          {step === 2 && (
            <div className="form-step">
              <h2 className="step-section-title">🔬 {t('intake.step2_title')}</h2>
              <div className="icmr-banner">
                <span>📊 ICMR Reference Ranges: TSH 0.5–4.5 mIU/L · T3 2.0–4.4 pg/mL · T4 0.8–1.8 ng/dL</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('intake.tsh')}</label>
                  <input type="number" min="0" max="50" step="0.1" className="form-input" placeholder="e.g. 3.2" value={form.tsh} onChange={e => updateField('tsh', e.target.value)} onKeyDown={handleNumericKeyDown} id="field-tsh" />
                  {form.tsh && parseFloat(form.tsh) > 4.5 && (
                    <span className="field-warning">⚠️ Above ICMR normal range (0.5–4.5)</span>
                  )}
                  {form.tsh && parseFloat(form.tsh) > 10 && (
                    <span className="field-error">🚨 CRITICAL: TSH &gt; 10 — emergency referral required</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('intake.t3')}</label>
                  <input type="number" min="0" max="20" step="0.1" className="form-input" placeholder="e.g. 3.1" value={form.t3} onChange={e => updateField('t3', e.target.value)} onKeyDown={handleNumericKeyDown} id="field-t3" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('intake.t4')}</label>
                  <input type="number" min="0" max="30" step="0.1" className="form-input" placeholder="e.g. 1.1" value={form.t4} onChange={e => updateField('t4', e.target.value)} onKeyDown={handleNumericKeyDown} id="field-t4" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('intake.severity_score')}: <strong>{form.severity_score}/10</strong></label>
                  <input type="range" min="0" max="10" step="1" className="range-input" value={form.severity_score} onChange={e => updateField('severity_score', e.target.value)} id="field-severity" />
                  <div className="range-labels">
                    <span>No symptoms</span><span>Severe</span>
                  </div>
                </div>
              </div>
              {form.severity_score && parseInt(form.severity_score) > 7 && (
                <div className="form-alert form-alert-danger">
                  🚨 Symptom severity &gt; 7 — emergency referral will be triggered
                </div>
              )}
            </div>
          )}

          {/* Step 3: Symptoms */}
          {step === 3 && (
            <div className="form-step">
              <h2 className="step-section-title">🩺 {t('intake.step3_title')}</h2>
              <div className="voice-btn-row">
                <button className="btn btn-secondary btn-sm" onClick={handleVoiceInput} id="voice-input-btn">
                  🎙️ {t('intake.voice_input')}
                </button>
                <span className="voice-hint">Speak in Hindi — e.g. "थकान और बालों का झड़ना"</span>
              </div>
              <p className="symptom-label-text">{t('intake.symptoms_title')}:</p>
              <div className="symptoms-grid">
                {SYMPTOMS.map(s => (
                  <button
                    key={s.key}
                    className={`symptom-btn ${form[s.key as keyof IntakeFormData] ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(s.key as keyof IntakeFormData)}
                    id={`symptom-${s.key}`}
                  >
                    <span className="symptom-icon">{s.icon}</span>
                    <span className="symptom-label">{t(s.labelKey)}</span>
                    {form[s.key as keyof IntakeFormData] && (
                      <span className="symptom-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="selected-count">
                {Object.values(SYMPTOMS).filter(s => form[s.key as keyof IntakeFormData]).length} symptoms selected
              </div>
            </div>
          )}

          {/* Step 4: History */}
          {step === 4 && (
            <div className="form-step">
              <h2 className="step-section-title">📋 {t('intake.step4_title')}</h2>
              <div className="history-grid">
                {[
                  { key: 'family_history_thyroid', label: t('intake.family_history'), icon: '🧬' },
                  { key: 'pcos_history', label: t('intake.pcos_history'), icon: '♀️' },
                  { key: 'pregnancy_status', label: t('intake.pregnancy_status'), icon: '🤰' },
                  { key: 'postpartum_flag', label: t('intake.postpartum'), icon: '👶' },
                ].map(item => (
                  <div
                    key={item.key}
                    className={`history-card glass-card ${form[item.key as keyof IntakeFormData] ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(item.key as keyof IntakeFormData)}
                    id={`history-${item.key}`}
                  >
                    <span className="history-icon">{item.icon}</span>
                    <span className="history-label">{item.label}</span>
                    <div className={`history-toggle ${form[item.key as keyof IntakeFormData] ? 'on' : ''}`}>
                      {form[item.key as keyof IntakeFormData] ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
                <label className="form-label">{t('intake.medications')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Levothyroxine 25mcg, none"
                  value={form.medication_current}
                  onChange={e => updateField('medication_current', e.target.value)}
                  id="field-medications"
                />
              </div>
            </div>
          )}

          {/* Step 5: Lifestyle */}
          {step === 5 && (
            <div className="form-step">
              <h2 className="step-section-title">🌿 {t('intake.step5_title')}</h2>
              <div className="form-group">
                <label className="form-label">{t('intake.diet_pref')}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle-btn ${form.diet_pref === 'vegetarian' ? 'active' : ''}`}
                    onClick={() => updateField('diet_pref', 'vegetarian' as DietPref)}
                    id="diet-vegetarian"
                  >
                    🥗 {t('intake.vegetarian')}
                  </button>
                  <button
                    className={`toggle-btn ${form.diet_pref === 'non-vegetarian' ? 'active' : ''}`}
                    onClick={() => updateField('diet_pref', 'non-vegetarian' as DietPref)}
                    id="diet-nonvegetarian"
                  >
                    🍖 {t('intake.non_vegetarian')}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('intake.region')}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle-btn ${form.iodine_zone === 'inland' ? 'active' : ''}`}
                    onClick={() => updateField('iodine_zone', 'inland' as IodineZone)}
                    id="region-inland"
                  >
                    🌾 {t('intake.inland')} — low natural iodine
                  </button>
                  <button
                    className={`toggle-btn ${form.iodine_zone === 'coastal' ? 'active' : ''}`}
                    onClick={() => updateField('iodine_zone', 'coastal' as IodineZone)}
                    id="region-coastal"
                  >
                    🌊 {t('intake.coastal')} — natural iodine access
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="form-summary glass-card">
                <h3 className="form-summary-title">📝 Submission Summary</h3>
                <div className="summary-grid">
                  <div><span className="summary-key">Age:</span> <span>{form.age || '—'}</span></div>
                  <div><span className="summary-key">BMI:</span> <span>{form.bmi || '—'}</span></div>
                  <div><span className="summary-key">TSH:</span> <span>{form.tsh || '—'} mIU/L</span></div>
                  <div><span className="summary-key">T3:</span> <span>{form.t3 || '—'} pg/mL</span></div>
                  <div><span className="summary-key">T4:</span> <span>{form.t4 || '—'} ng/dL</span></div>
                  <div><span className="summary-key">Severity:</span> <span>{form.severity_score}/10</span></div>
                  <div><span className="summary-key">Symptoms:</span> <span>{Object.values(SYMPTOMS).filter(s => form[s.key as keyof IntakeFormData]).length} selected</span></div>
                  <div><span className="summary-key">Diet:</span> <span>{form.diet_pref}</span></div>
                  <div><span className="summary-key">Region:</span> <span>{form.iodine_zone}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-nav">
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} id="btn-prev">
                ← {t('intake.previous')}
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                id="btn-next"
              >
                {t('intake.next')} →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                id="btn-submit"
              >
                {loading ? (
                  <><div className="spinner" /> Running AI Analysis...</>
                ) : (
                  <>{t('intake.submit')} 🤖</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
