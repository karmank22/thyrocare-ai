import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendationSet } from '../../types';

interface Props {
  recommendations: RecommendationSet;
}

type Tab = 'high_priority' | 'lifestyle' | 'diet';

export default function PersonalizedRecommendations({ recommendations }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('high_priority');

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'high_priority', label: 'High Priority', icon: '🚨' },
    { key: 'lifestyle', label: t('dashboard.lifestyle'), icon: '🌿' },
    { key: 'diet', label: t('dashboard.diet'), icon: '🥗' },
  ];

  const contentMap: Record<Tab, string[]> = {
    high_priority: recommendations.high_priority || [
      `📅 Follow up based on physician's advice`,
      `📊 Referral level: ${recommendations.referral_tier === 'none' ? 'Self-monitor' : recommendations.referral_tier}`
    ],
    lifestyle: recommendations.lifestyle || [],
    diet: recommendations.diet || [],
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
    </div>
  );
}
