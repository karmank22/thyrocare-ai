import React, { useEffect, useRef, useState } from 'react';
import { X, Download, TrendingDown, TrendingUp, Minus, AlertCircle, Info, Calendar, Activity, CheckCircle, Droplet, Thermometer, Weight, ShieldAlert } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import type { AssessmentRecord } from '../../pages/HistoryPage';
import './AssessmentComparisonModal.css';

interface Props {
  older: AssessmentRecord;
  newer: AssessmentRecord;
  onClose: () => void;
}

export default function AssessmentComparisonModal({ older, newer, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExportPDF = async () => {
    if (!pdfWrapperRef.current) return;
    setIsExporting(true);
    
    const opt = {
      margin: 10,
      filename: `ThyroCare_Comparison_${new Date(newer.created_at).toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(pdfWrapperRef.current).set(opt).save();
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const calculateChange = (oldVal: number, newVal: number) => {
    const diff = newVal - oldVal;
    const percent = oldVal !== 0 ? (diff / oldVal) * 100 : 0;
    return { diff, percent };
  };

  const tshChange = calculateChange(older.tsh, newer.tsh);
  const bmiChange = calculateChange(older.bmi, newer.bmi);
  const riskScoreChange = calculateChange(older.risk_score * 100, newer.risk_score * 100);

  const riskLevels = ['Normal', 'Mild', 'Moderate', 'High'];
  const oldRiskIdx = riskLevels.indexOf(older.risk_class);
  const newRiskIdx = riskLevels.indexOf(newer.risk_class);
  
  let riskStatusText = "Stable";
  let overallImproved = false;
  let overallWorsened = false;
  if (newRiskIdx < oldRiskIdx) {
    riskStatusText = "Improved";
    overallImproved = true;
  } else if (newRiskIdx > oldRiskIdx) {
    riskStatusText = "Worsened";
    overallWorsened = true;
  }

  // Generate a single punchy sentence for the hero card
  const generateHeroSentence = () => {
    if (overallImproved) {
      return `Thyroid health has improved since the previous assessment. Risk reduced from ${older.risk_class} to ${newer.risk_class}.`;
    } else if (overallWorsened) {
      return `Thyroid health shows signs of decline. Risk increased from ${older.risk_class} to ${newer.risk_class}.`;
    } else {
      if (Math.abs(tshChange.percent) > 5) {
        return `Risk status remains ${newer.risk_class}, but TSH has ${tshChange.diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(tshChange.percent).toFixed(1)}%.`;
      }
      return `Thyroid health is stable. Risk status remains ${newer.risk_class}.`;
    }
  };

  const getRiskBadge = (riskClass: string) => {
    switch (riskClass) {
      case 'Normal': return <span className="badge badge-success">✅ Normal</span>;
      case 'Mild': return <span className="badge badge-warning">🟡 Mild</span>;
      case 'Moderate': return <span className="badge badge-orange">🟠 Moderate</span>;
      case 'High': return <span className="badge badge-danger">🔴 High Risk</span>;
      default: return <span className="badge">{riskClass}</span>;
    }
  };

  // Difference column (numerical absolute + percent)
  const renderChangeColumn = (change: {diff: number, percent: number}) => {
    if (Math.abs(change.diff) < 0.1) {
      return <span className="change-val">0.00</span>;
    }
    const sign = change.diff > 0 ? '+' : '';
    return (
      <span className="change-val">
        <span className="change-diff">{sign}{change.diff.toFixed(2)}</span>
        <span className="change-pct">{sign}{change.percent.toFixed(1)}%</span>
      </span>
    );
  };

  // Trend pill combining icon and text ONLY
  const renderTrendPill = (change: {diff: number, percent: number}, invertLogic = false) => {
    if (Math.abs(change.diff) < 0.1) {
      return (
        <span className="trend-pill stable">
          <Minus size={14} /> Stable
        </span>
      );
    }
    const isImproved = invertLogic ? change.diff > 0 : change.diff < 0;
    
    return (
      <span className={`trend-pill ${isImproved ? 'improved' : 'worsened'}`}>
        {change.diff < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
        {isImproved ? 'Improved' : 'Worsened'}
      </span>
    );
  };

  // Recommendations Parsing
  let olderRecs = { diet: [], lifestyle: [] };
  let newerRecs = { diet: [], lifestyle: [] };
  try {
    if (older.recommendations_json) olderRecs = JSON.parse(older.recommendations_json);
    if (newer.recommendations_json) newerRecs = JSON.parse(newer.recommendations_json);
  } catch(e) {}

  const msElapsed = new Date(newer.created_at).getTime() - new Date(older.created_at).getTime();
  const daysElapsed = Math.round(msElapsed / (1000 * 60 * 60 * 24));
  let timeString = `${daysElapsed} days apart`;
  if (daysElapsed > 30) {
    const months = Math.round(daysElapsed / 30);
    timeString = `${months} month${months > 1 ? 's' : ''} apart`;
  }

  return (
    <div className="comparison-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="comparison-modal-content" onClick={e => e.stopPropagation()} ref={modalRef}>
        
        {/* Sticky Header */}
        <div className="comparison-modal-header">
          <h2 id="modal-title"><Activity size={22} color="var(--color-primary)" /> Assessment Comparison</h2>
          <div className="comparison-header-actions">
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleExportPDF}
              disabled={isExporting}
              aria-label="Download PDF Report"
            >
              <Download size={16} style={{marginRight: '6px'}} /> 
              {isExporting ? 'Exporting...' : 'Download Report'}
            </button>
            <button className="btn-icon-only" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body - Exported to PDF */}
        <div className="comparison-modal-body">
          <div className="pdf-export-wrapper" ref={pdfWrapperRef}>
            
            {/* Title for PDF */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Clinical Comparison Report</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>ThyroCare AI • Generated {new Date().toLocaleDateString()}</p>
            </div>

            {/* 1. Hero Summary Card */}
            <div className="hero-summary-card">
              <div className="hero-summary-header">
                <div className={`hero-icon-wrapper ${overallWorsened ? 'worsened' : ''}`}>
                  {overallWorsened ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                </div>
                <div className="hero-text">
                  <h3>Overall Progress Summary</h3>
                  <p>{generateHeroSentence()}</p>
                </div>
              </div>
              
              <div className="hero-metrics-grid">
                <div className="hero-metric-card">
                  <span className="metric-label">Risk Shift</span>
                  <span className="metric-value">
                    {riskStatusText}
                  </span>
                </div>
                <div className="hero-metric-card">
                  <span className="metric-label">TSH Change</span>
                  <span className="metric-value">
                    {tshChange.diff > 0 ? '+' : ''}{tshChange.diff.toFixed(2)} mIU/L
                  </span>
                </div>
                <div className="hero-metric-card">
                  <span className="metric-label">BMI Change</span>
                  <span className="metric-value">
                    {bmiChange.diff > 0 ? '+' : ''}{bmiChange.diff.toFixed(1)}
                  </span>
                </div>
                <div className="hero-metric-card">
                  <span className="metric-label">Risk Score</span>
                  <span className="metric-value">
                    {riskScoreChange.diff > 0 ? '+' : ''}{riskScoreChange.diff.toFixed(0)} pts
                  </span>
                </div>
              </div>

              <div className="hero-banner">
                <Info size={16} /> Continue following the current lifestyle recommendations for best results.
              </div>
            </div>

            {/* 2. Assessment Timeline */}
            <div className="timeline-section">
              <div className="timeline-card">
                <div className="timeline-label">Previous Assessment</div>
                <div className="timeline-date-large">
                  <Calendar size={18} color="var(--text-muted)" />
                  {new Date(older.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>{getRiskBadge(older.risk_class)}</div>
              </div>
              
              <div className="timeline-connector">
                <div className="connector-title">Comparison Period</div>
                <div className="connector-line"></div>
                <div className="connector-badge">
                  {timeString}
                </div>
              </div>
              
              <div className="timeline-card">
                <div className="timeline-label">Current Assessment</div>
                <div className="timeline-date-large">
                  <Calendar size={18} color="var(--color-primary)" />
                  {new Date(newer.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>{getRiskBadge(newer.risk_class)}</div>
              </div>
            </div>

            {/* 3. Clinical Comparison Table */}
            <div className="comparison-table-wrapper">
              <div className="table-header-title">Biomarker Comparison</div>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Previous</th>
                    <th>Current</th>
                    <th>Change</th>
                    <th>Trend</th>
                    <th>Reference Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="metric-name-wrapper">
                        <div className="metric-icon"><Droplet size={16} /></div>
                        <span className="metric-name">TSH</span>
                      </div>
                    </td>
                    <td className="metric-val">{older.tsh.toFixed(2)}</td>
                    <td className="metric-val">{newer.tsh.toFixed(2)}</td>
                    <td>{renderChangeColumn(calculateChange(older.tsh, newer.tsh))}</td>
                    <td>{renderTrendPill(calculateChange(older.tsh, newer.tsh))}</td>
                    <td className="ref-range-text">0.4 - 4.0 mIU/L</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="metric-name-wrapper">
                        <div className="metric-icon"><Thermometer size={16} /></div>
                        <span className="metric-name">T3</span>
                      </div>
                    </td>
                    <td className="metric-val">{older.t3.toFixed(2)}</td>
                    <td className="metric-val">{newer.t3.toFixed(2)}</td>
                    <td>{renderChangeColumn(calculateChange(older.t3, newer.t3))}</td>
                    <td>{renderTrendPill(calculateChange(older.t3, newer.t3), true)}</td>
                    <td className="ref-range-text">1.2 - 3.1 nmol/L</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="metric-name-wrapper">
                        <div className="metric-icon"><Thermometer size={16} /></div>
                        <span className="metric-name">T4</span>
                      </div>
                    </td>
                    <td className="metric-val">{older.t4.toFixed(2)}</td>
                    <td className="metric-val">{newer.t4.toFixed(2)}</td>
                    <td>{renderChangeColumn(calculateChange(older.t4, newer.t4))}</td>
                    <td>{renderTrendPill(calculateChange(older.t4, newer.t4), true)}</td>
                    <td className="ref-range-text">60 - 160 nmol/L</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="metric-name-wrapper">
                        <div className="metric-icon"><Weight size={16} /></div>
                        <span className="metric-name">BMI</span>
                      </div>
                    </td>
                    <td className="metric-val">{older.bmi.toFixed(1)}</td>
                    <td className="metric-val">{newer.bmi.toFixed(1)}</td>
                    <td>{renderChangeColumn(calculateChange(older.bmi, newer.bmi))}</td>
                    <td>{renderTrendPill(calculateChange(older.bmi, newer.bmi))}</td>
                    <td className="ref-range-text">18.5 - 24.9</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="metric-name-wrapper">
                        <div className="metric-icon"><ShieldAlert size={16} /></div>
                        <span className="metric-name">Risk Score</span>
                      </div>
                    </td>
                    <td className="metric-val">{(older.risk_score * 100).toFixed(0)}</td>
                    <td className="metric-val">{(newer.risk_score * 100).toFixed(0)}</td>
                    <td>{renderChangeColumn(calculateChange(older.risk_score * 100, newer.risk_score * 100))}</td>
                    <td>{renderTrendPill(calculateChange(older.risk_score * 100, newer.risk_score * 100))}</td>
                    <td className="ref-range-text">&lt; 30 Low Risk</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: 'var(--space-2xl)', fontStyle: 'italic', paddingLeft: 'var(--space-md)' }}>
              * Reference ranges may vary between laboratories and are provided for informational purposes only.
            </p>

            {/* 4. Recommendations Comparison */}
            <div className="recommendations-comparison">
              <h3>Lifestyle Recommendations Map</h3>
              <div className="rec-grid">
                <div className="rec-card">
                  <h4>Previous Routine</h4>
                  <ul className="rec-list">
                    {olderRecs.lifestyle?.map((rec: string, i: number) => (
                      <li key={i} className={!newerRecs.lifestyle?.includes(rec) ? 'rec-diff-removed' : 'rec-diff-kept'}>
                        {rec}
                      </li>
                    ))}
                    {!olderRecs.lifestyle?.length && <li className="rec-diff-kept">No lifestyle recommendations.</li>}
                  </ul>
                </div>
                <div className="rec-card">
                  <h4>Current Routine</h4>
                  <ul className="rec-list">
                    {newerRecs.lifestyle?.map((rec: string, i: number) => (
                      <li key={i} className={!olderRecs.lifestyle?.includes(rec) ? 'rec-diff-added' : 'rec-diff-kept'}>
                        {rec}
                      </li>
                    ))}
                    {!newerRecs.lifestyle?.length && <li className="rec-diff-kept">No lifestyle recommendations.</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Medical Disclaimer */}
            <div className="medical-disclaimer-card">
              <AlertCircle size={20} />
              <div>
                <strong>Medical Disclaimer:</strong> This comparison is intended for informational purposes only and should not replace professional medical advice. Please consult a qualified healthcare provider regarding your thyroid health.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
