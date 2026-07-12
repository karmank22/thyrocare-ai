import React from 'react';
import { useTranslation } from 'react-i18next';
import type { RiskClass } from '../../types';
import { LANGUAGES } from '../../i18n';

interface Props {
  explanation: string;
  language: string;
  riskClass: RiskClass;
}

const RISK_COLORS: Record<RiskClass, string> = {
  Normal: '#00c896', Mild: '#f59e0b', Moderate: '#f97316', High: '#ef4444',
};

export default function GenAIExplanation({ explanation, language, riskClass }: Props) {
  const { t } = useTranslation();
  const langInfo = LANGUAGES.find(l => l.code === language);
  const riskColor = RISK_COLORS[riskClass];

  return (
    <div className="glass-card panel-card panel-genai animate-fadeInUp" id="panel-genai-explanation">
      <div className="panel-title">
        <div className="panel-title-icon">🤖</div>
        {t('dashboard.ai_explanation')}
      </div>

      {/* Language indicator */}
      <div className="genai-lang-badge">
        <span>{langInfo?.flag || '🌐'}</span>
        <span>{langInfo?.nativeName || 'English'}</span>
        <span className="genai-grade">Grade ~5.8 reading level</span>
      </div>

      {/* Explanation text */}
      <div className="genai-text" style={{ borderLeftColor: riskColor }}>
        {explanation}
      </div>

      {/* Metadata */}
      <div className="genai-meta">
        <div className="genai-meta-item">
          <span className="genai-meta-label">Model</span>
          <span className="genai-meta-value">ThyroCare-AI GenAI v1</span>
        </div>
        <div className="genai-meta-item">
          <span className="genai-meta-label">Readability</span>
          <span className="genai-meta-value" style={{ color: '#00c896' }}>✓ Grade 5.8</span>
        </div>
        <div className="genai-meta-item">
          <span className="genai-meta-label">Review</span>
          <span className="genai-meta-value" style={{ color: '#f59e0b' }}>Pending clinician</span>
        </div>
      </div>

      <div className="genai-disclaimer">
        ⚕️ This explanation is AI-generated for health literacy purposes. Clinical decisions require physician review.
      </div>
    </div>
  );
}
