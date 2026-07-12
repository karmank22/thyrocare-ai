import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import type { TSHTrendPoint, RiskClass } from '../../types';

interface Props { data: TSHTrendPoint[]; }

const RISK_COLORS: Record<RiskClass, string> = {
  Normal: '#00c896', Mild: '#f59e0b', Moderate: '#f97316', High: '#ef4444',
};

const CustomDot = (props: { cx?: number; cy?: number; payload?: TSHTrendPoint }) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const color = RISK_COLORS[payload.risk_class];
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke={color} strokeWidth={2} />;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: TSHTrendPoint }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const color = RISK_COLORS[data.payload.risk_class];
  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 600 }}>TSH: {data.value} mIU/L</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.payload.risk_class}</div>
    </div>
  );
};

export default function TSHTrendChart({ data }: Props) {
  const { t } = useTranslation();
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const delta = latest && prev ? (latest.tsh - prev.tsh).toFixed(1) : null;
  const improving = delta && parseFloat(delta) < 0;

  return (
    <div className="glass-card panel-card animate-fadeInUp" id="panel-tsh-trend">
      <div className="panel-title">
        <div className="panel-title-icon">📈</div>
        {t('dashboard.tsh_trend')}
      </div>

      {/* Latest value summary */}
      {latest && (
        <div className="trend-summary">
          <div>
            <div className="trend-current" style={{ color: RISK_COLORS[latest.risk_class] }}>
              {latest.tsh} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>mIU/L</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest TSH ({latest.date})</div>
          </div>
          {delta && (
            <div className={`trend-delta ${improving ? 'improving' : 'worsening'}`}>
              {improving ? '↓' : '↑'} {Math.abs(parseFloat(delta))} mIU/L
              <div style={{ fontSize: '0.7rem' }}>{improving ? 'Improving' : 'Increasing'}</div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 180, marginTop: 'var(--space-md)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="tshGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            {/* ICMR normal range band */}
            <ReferenceLine y={4.5} stroke="rgba(0,200,150,0.5)" strokeDasharray="4 4"
              label={{ value: 'Upper Normal', fill: 'var(--text-muted)', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={0.5} stroke="rgba(0,200,150,0.3)" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="tsh" stroke="#00c896" strokeWidth={2.5}
              fill="url(#tshGradient)" dot={<CustomDot />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-legend">
        <span>🟢 Normal (0.5–4.5)</span>
        <span>🟡 Mild (4.5–6)</span>
        <span>🟠 Mod (6–8)</span>
        <span>🔴 High (&gt;8)</span>
      </div>
    </div>
  );
}
