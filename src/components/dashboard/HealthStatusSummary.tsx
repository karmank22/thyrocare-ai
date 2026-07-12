import React from 'react';
import { useTranslation } from 'react-i18next';
import type { RiskAssessment, RiskClass } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Props {
  assessment: RiskAssessment;
}

const RISK_COLORS: Record<RiskClass, string> = {
  Normal: '#00c896',
  Mild: '#f59e0b',
  Moderate: '#f97316',
  High: '#ef4444',
};

const RISK_ICONS: Record<RiskClass, string> = {
  Normal: '✅', Mild: '🟡', Moderate: '🟠', High: '🔴',
};

const FEATURE_LABELS: Record<string, string> = {
  tsh: 'TSH Level', t3: 'T3 Level', t4: 'T4 Level',
  menstrual_irregularity: 'Menstrual Irregularity',
  symptom_severity_score: 'Symptom Severity',
  bmi: 'BMI', pcos_history: 'PCOS History',
  family_history_thyroid: 'Family History',
  age: 'Age', hair_fall: 'Hair Fall',
  fatigue: 'Fatigue', weight_gain: 'Weight Gain',
  cold_intolerance: 'Cold Intolerance',
  mood_changes: 'Mood Changes',
};

export default function HealthStatusSummary({ assessment }: Props) {
  const { t } = useTranslation();
  const { risk_class, rf_confidence, xgb_confidence, ensemble_confidence, shap_values, emergency_flag } = assessment;
  const riskColor = RISK_COLORS[risk_class];

  // Top 5 SHAP features for the chart
  const shapData = Object.entries(shap_values)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, value]) => ({
      name: FEATURE_LABELS[key] || key,
      value: parseFloat((value * 100).toFixed(1)),
    }));

  const riskLabel = t(`dashboard.risk_${risk_class.toLowerCase()}`);

  return (
    <div className="glass-card panel-card panel-status animate-fadeInUp" id="panel-health-status">
      <div className="panel-title">
        <div className="panel-title-icon">❤️</div>
        Risk Assessment
      </div>

      {/* Main risk display */}
      <div className="status-main" style={{ borderColor: riskColor }}>
        <div className="status-icon-large">{RISK_ICONS[risk_class]}</div>
        <div className={`risk-badge risk-badge-${risk_class.toLowerCase()} status-badge`}>
          {riskLabel}
        </div>
        {emergency_flag && (
          <div className="status-emergency">🚨 Emergency</div>
        )}
      </div>

      {/* Confidence scores */}
      <div className="confidence-grid">
        <div className="conf-item">
          <span className="conf-label">Random Forest</span>
          <span className="conf-value" style={{ color: riskColor }}>
            {(rf_confidence * 100).toFixed(1)}%
          </span>
          <div className="conf-bar">
            <div className="conf-bar-fill" style={{ width: `${rf_confidence * 100}%`, background: riskColor }} />
          </div>
        </div>
        <div className="conf-item">
          <span className="conf-label">XGBoost</span>
          <span className="conf-value" style={{ color: riskColor }}>
            {(xgb_confidence * 100).toFixed(1)}%
          </span>
          <div className="conf-bar">
            <div className="conf-bar-fill" style={{ width: `${xgb_confidence * 100}%`, background: riskColor }} />
          </div>
        </div>
        <div className="conf-item">
          <span className="conf-label">Ensemble (Final)</span>
          <span className="conf-value conf-value-big" style={{ color: riskColor }}>
            {(ensemble_confidence * 100).toFixed(1)}%
          </span>
          <div className="conf-bar">
            <div className="conf-bar-fill" style={{ width: `${ensemble_confidence * 100}%`, background: `linear-gradient(90deg, #00c896, #00a3ff)` }} />
          </div>
        </div>
      </div>

      {/* SHAP Chart */}
      <div className="shap-section">
        <div className="shap-title">{t('dashboard.shap_title')}</div>
        <div className="shap-subtitle">{t('dashboard.shap_subtitle')}</div>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ left: -10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category" dataKey="name" width={130}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Contribution']}
                contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {shapData.map((_, i) => (
                  <Cell key={i} fill={`rgba(0,200,150,${1 - i * 0.15})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
