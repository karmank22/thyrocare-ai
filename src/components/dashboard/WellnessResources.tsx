import React from 'react';
import { useTranslation } from 'react-i18next';

interface Resource {
  id: string; title: string; subtitle: string;
  description: string; url: string; icon: string; tags: string[];
}
interface Props { resources: Resource[]; }

export default function WellnessResources({ resources }: Props) {
  const { t } = useTranslation();
  return (
    <div className="glass-card panel-card animate-fadeInUp" id="panel-wellness-resources">
      <div className="panel-title">
        <div className="panel-title-icon">📚</div>
        {t('dashboard.resources')}
      </div>
      <div className="resources-grid">
        {resources.map(r => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
            className="resource-card glass-card" id={`resource-${r.id}`}>
            <div className="resource-icon">{r.icon}</div>
            <div className="resource-body">
              <div className="resource-title">{r.title}</div>
              <div className="resource-subtitle">{r.subtitle}</div>
              <div className="resource-desc">{r.description}</div>
              <div className="resource-tags">
                {r.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            </div>
            <div className="resource-arrow">→</div>
          </a>
        ))}
      </div>
    </div>
  );
}
