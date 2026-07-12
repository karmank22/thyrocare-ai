import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WellnessGoal } from '../../types';

interface Props {
  goals: WellnessGoal[];
  onToggle: (id: string) => void;
}

export default function DailyWellnessGoalTracker({ goals, onToggle }: Props) {
  const { t } = useTranslation();
  const completed = goals.filter(g => g.completed).length;
  const pct = Math.round((completed / goals.length) * 100);

  return (
    <div className="glass-card panel-card animate-fadeInUp" id="panel-wellness-goals">
      <div className="panel-title">
        <div className="panel-title-icon">🎯</div>
        {t('dashboard.wellness_goals')}
      </div>

      {/* Progress ring */}
      <div className="goals-progress">
        <div className="goals-progress-ring">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border)" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none"
              stroke="url(#ringGrad)" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 34 * pct / 100} ${2 * Math.PI * 34}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00c896" />
                <stop offset="100%" stopColor="#00a3ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="goals-progress-text">
            <span className="goals-pct">{pct}%</span>
          </div>
        </div>
        <div className="goals-progress-info">
          <div className="goals-count">
            <span className="gradient-text">{completed}</span>
            <span style={{ color: 'var(--text-muted)' }}>/{goals.length}</span>
          </div>
          <div className="goals-count-label">Goals Today</div>
          {completed === goals.length && (
            <div className="goals-complete-badge">🏆 Perfect Day!</div>
          )}
        </div>
      </div>

      {/* Goal list */}
      <div className="goals-list">
        {goals.map(goal => (
          <button
            key={goal.id}
            className={`goal-item ${goal.completed ? 'completed' : ''}`}
            onClick={() => onToggle(goal.id)}
            id={`goal-${goal.id}`}
          >
            <div className={`goal-checkbox ${goal.completed ? 'checked' : ''}`}>
              {goal.completed && '✓'}
            </div>
            <span className="goal-icon">{goal.icon}</span>
            <span className="goal-label">{goal.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
