import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendationSet } from '../../types';

interface Props {
  recommendations: RecommendationSet;
}

type Tab = 'diet' | 'exercise' | 'lifestyle' | 'followup';

export default function PersonalizedRecommendations({ recommendations }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('diet');

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'diet', label: t('dashboard.diet'), icon: '🥗' },
    { key: 'exercise', label: t('dashboard.exercise'), icon: '🧘' },
    { key: 'lifestyle', label: t('dashboard.lifestyle'), icon: '🌿' },
    { key: 'followup', label: t('dashboard.followup'), icon: '📅' },
  ];

  const contentMap: Record<Tab, string[]> = {
    diet: recommendations.diet_recommendations,
    exercise: recommendations.exercise_recommendations,
    lifestyle: recommendations.lifestyle_recommendations,
    followup: [
      `📅 Repeat test in ${recommendations.followup_interval_days} days`,
      `🔬 Tests required: ${recommendations.followup_test_required}`,
      `📊 Risk level: ${recommendations.referral_tier === 'none' ? 'Self-monitor' : recommendations.referral_tier}`,
      '💊 Take medication at the same time each day (if prescribed)',
      '📝 Keep a symptom diary to share at your next appointment',
    ],
  };

  return (
    <div className="glass-card panel-card panel-recommendations animate-fadeInUp" id="panel-recommendations">
      <div className="panel-title">
        <div className="panel-title-icon">🎯</div>
        {t('dashboard.recommendations')}
      </div>

      {/* Tab bar */}
      <div className="tab-list" style={{ marginBottom: 'var(--space-lg)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            id={`tab-${tab.key}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rec-list animate-fadeIn" key={activeTab}>
        {contentMap[activeTab].map((item, i) => (
          <div key={i} className="rec-item">
            <div className="rec-bullet" />
            <p className="rec-text">{item}</p>
          </div>
        ))}
      </div>

      {/* Follow-up reminder chip */}
      <div className="followup-chip">
        <span>⏰</span>
        Next assessment in <strong>{recommendations.followup_interval_days} days</strong>
        &nbsp;—&nbsp;{recommendations.followup_test_required}
      </div>
    </div>
  );
}
