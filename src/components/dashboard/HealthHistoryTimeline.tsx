import React from 'react';
import { useTranslation } from 'react-i18next';
import type { HistoryEntry, RiskClass } from '../../types';

interface Props { history: HistoryEntry[]; }

const RISK_COLORS: Record<RiskClass, string> = {
  Normal: '#00c896', Mild: '#f59e0b', Moderate: '#f97316', High: '#ef4444',
};

export default function HealthHistoryTimeline({ history }: Props) {
  const { t } = useTranslation();

  return (
    <div className="glass-card panel-card animate-fadeInUp" id="panel-history-timeline">
      <div className="panel-title">
        <div className="panel-title-icon">📅</div>
        {t('dashboard.history')}
      </div>

      <div className="timeline">
        {history.map((entry, i) => {
          const date = new Date(entry.date);
          const color = RISK_COLORS[entry.risk_class];
          return (
            <div key={i} className="timeline-item">
              <div className="timeline-line-wrap">
                <div className="timeline-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                {i < history.length - 1 && <div className="timeline-connector" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-date">
                  {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
                <div className="timeline-header">
                  <span className={`risk-badge risk-badge-${entry.risk_class.toLowerCase()}`} style={{ fontSize: '0.6875rem' }}>
                    {entry.risk_class}
                  </span>
                  <span className="timeline-tsh" style={{ color }}>TSH {entry.tsh}</span>
                </div>
                <div className="timeline-note">{entry.notes}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
