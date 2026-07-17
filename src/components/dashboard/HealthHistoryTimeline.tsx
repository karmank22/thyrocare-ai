import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import type { HistoryEntry, RiskClass } from '../../types';

interface Props { 
  history: HistoryEntry[];
  hasMore?: boolean;
}

const RISK_COLORS: Record<RiskClass, string> = {
  Normal: '#00c896', Mild: '#f59e0b', Moderate: '#f97316', High: '#ef4444',
};

const RISK_SCORES: Record<RiskClass, number> = {
  Normal: 0, Mild: 1, Moderate: 2, High: 3,
};

export default function HealthHistoryTimeline({ history, hasMore = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="glass-card panel-card animate-fadeInUp" id="panel-history-timeline" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-card)' }}>
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
        <div className="timeline-container">
          <div className="timeline">
            {history.map((entry, i) => {
              const date = new Date(entry.date);
              const color = RISK_COLORS[entry.risk_class];
              const isLatest = i === 0;
              
              let trendText = '→ No Change';
              let trendColor = 'var(--text-muted)';
              
              if (i < history.length - 1) {
                const previous = history[i + 1];
                const currentTsh = entry.tsh;
                const prevTsh = previous.tsh || 0;
                
                if (currentTsh > prevTsh) trendText = '↗ Increased';
                else if (currentTsh < prevTsh) trendText = '↘ Decreased';
                
                const currentScore = RISK_SCORES[entry.risk_class];
                const previousScore = RISK_SCORES[previous.risk_class];
                
                if (currentScore < previousScore) trendColor = 'var(--risk-normal)';
                else if (currentScore > previousScore) trendColor = 'var(--risk-high)';
                else {
                  const currentDiff = Math.abs(currentTsh - 2.5);
                  const prevDiff = Math.abs(prevTsh - 2.5);
                  if (currentDiff < prevDiff - 0.5) trendColor = 'var(--risk-normal)';
                  else if (currentDiff > prevDiff + 0.5) trendColor = 'var(--risk-high)';
                }
              }

              return (
                <div key={i} className="timeline-item-minimal" onClick={() => navigate('/history')}>
                  <div className="timeline-line-wrap-minimal">
                    <div className={`timeline-dot-minimal ${isLatest ? 'latest' : ''}`} />
                    {i < history.length - 1 && <div className="timeline-dotted-line" />}
                  </div>
                  <div className="timeline-content-minimal">
                    <div className="timeline-row-minimal">
                      <div className="timeline-date-minimal">
                        {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="timeline-divider-minimal" />
                      <div className="timeline-label-minimal">TSH LEVEL</div>
                    </div>
                    <div className="timeline-tsh-row">
                      <div className="timeline-tsh-value-minimal">
                        {entry.tsh} <span className="timeline-tsh-unit-minimal">mIU/L</span>
                      </div>
                      {i < history.length - 1 && (
                        <div className="timeline-trend-minimal" style={{ color: trendColor }}>
                          {trendText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="timeline-footer-minimal" onClick={() => navigate('/history')}>
              <span>View All History</span>
              <ArrowRight size={16} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
