import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { HistoryEntry, RiskClass } from '../../types';

interface Props { history: HistoryEntry[]; }

const RISK_COLORS: Record<RiskClass, string> = {
  Normal: '#00c896', Mild: '#f59e0b', Moderate: '#f97316', High: '#ef4444',
};

const RISK_SCORES: Record<RiskClass, number> = {
  Normal: 0, Mild: 1, Moderate: 2, High: 3,
};

export default function HealthHistoryTimeline({ history }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="glass-card panel-card animate-fadeInUp" id="panel-history-timeline" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title">
        <div className="panel-title-icon">📅</div>
        {t('dashboard.history')}
      </div>

      {history.length === 0 ? (
        <div style={{ padding: 'var(--space-2xl) var(--space-md)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            <FileText size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ marginBottom: '8px' }}>No Assessments Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 'var(--space-lg)' }}>
            You haven't completed a thyroid assessment yet.<br/>
            Upload your first thyroid report to begin tracking your thyroid health over time.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/screening')} style={{ margin: '0 auto' }}>
            Upload First Report
          </button>
        </div>
      ) : (
        <div className="timeline">
          {history.map((entry, i) => {
            const date = new Date(entry.date);
            const color = RISK_COLORS[entry.risk_class];
            
            let trend = null;
            if (i < history.length - 1) {
              const previous = history[i + 1];
              const currentScore = RISK_SCORES[entry.risk_class];
              const previousScore = RISK_SCORES[previous.risk_class];
              
              if (currentScore < previousScore) trend = <span title="Improved" style={{ color: '#00c896', marginLeft: '6px' }}>⬇️</span>;
              else if (currentScore > previousScore) trend = <span title="Worsened" style={{ color: '#ef4444', marginLeft: '6px' }}>⬆️</span>;
              else {
                const currentDiff = Math.abs(entry.tsh - 2.5);
                const prevDiff = Math.abs((previous.tsh || 0) - 2.5);
                if (currentDiff < prevDiff - 0.5) trend = <span title="Slightly Improved" style={{ color: '#00c896', marginLeft: '6px' }}>↘️</span>;
                else if (currentDiff > prevDiff + 0.5) trend = <span title="Slightly Worsened" style={{ color: '#ef4444', marginLeft: '6px' }}>↗️</span>;
                else trend = <span title="Stable" style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>➡️</span>;
              }
            }

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
                    <span className="timeline-tsh" style={{ color, display: 'flex', alignItems: 'center' }}>
                      TSH {entry.tsh}
                      {trend}
                    </span>
                  </div>
                  <div className="timeline-note">{entry.notes}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
