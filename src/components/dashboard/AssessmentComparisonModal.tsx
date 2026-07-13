import React, { useEffect, useRef, useState } from 'react';
import { X, Download, TrendingDown, TrendingUp, Minus, AlertCircle, Info, Calendar } from 'lucide-react';
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

  // Focus trapping and ESC to close
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
      filename: `Thyroid_Comparison_${new Date(newer.created_at).toISOString().split('T')[0]}.pdf`,
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

  // Calculations
  const calculateChange = (oldVal: number, newVal: number) => {
    const diff = newVal - oldVal;
    const percent = oldVal !== 0 ? (diff / oldVal) * 100 : 0;
    return { diff, percent };
  };

  const tshChange = calculateChange(older.tsh, newer.tsh);
  const bmiChange = calculateChange(older.bmi, newer.bmi);
  const riskScoreChange = calculateChange(older.risk_score * 100, newer.risk_score * 100);

  // Risk Order mapping to determine improvement
  const riskLevels = ['Normal', 'Mild', 'Moderate', 'High'];
  const oldRiskIdx = riskLevels.indexOf(older.risk_class);
  const newRiskIdx = riskLevels.indexOf(newer.risk_class);
  
  let riskStatusText = "remained stable";
  if (newRiskIdx < oldRiskIdx) riskStatusText = "improved";
  else if (newRiskIdx > oldRiskIdx) riskStatusText = "worsened";

  // Dynamic Summary Generation
  const generateSummary = () => {
    let summary = [];
    
    // Overall Risk
    if (newRiskIdx < oldRiskIdx) {
      summary.push(`Your overall thyroid risk has improved from ${older.risk_class} to ${newer.risk_class}.`);
    } else if (newRiskIdx > oldRiskIdx) {
      summary.push(`Your overall thyroid risk has increased from ${older.risk_class} to ${newer.risk_class}.`);
    } else {
      summary.push(`Your overall thyroid risk remains stable at ${newer.risk_class}.`);
    }

    // TSH
    if (Math.abs(tshChange.percent) > 5) {
      const direction = tshChange.diff > 0 ? "increased" : "decreased";
      summary.push(`Your TSH levels have ${direction} by ${Math.abs(tshChange.percent).toFixed(1)}%.`);
    }

    // BMI
    if (Math.abs(bmiChange.diff) >= 0.5) {
      const direction = bmiChange.diff > 0 ? "increased" : "decreased";
      summary.push(`Your BMI has ${direction} by ${Math.abs(bmiChange.diff).toFixed(1)} units.`);
    }

    summary.push("Continue following your recommended lifestyle and medical advice.");

    return summary;
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

  const renderTrendIndicator = (change: {diff: number, percent: number}, invertLogic = false) => {
    if (Math.abs(change.diff) < 0.1) {
      return (
        <span className="trend-indicator trend-stable">
          <Minus size={14} /> Stable
        </span>
      );
    }

    // invertLogic: For BMI and TSH (usually), lower is better if previously high.
    // We'll simplify: negative diff is generally 'decreased'.
    // If invertLogic is true, a decrease is 'worsened' (not typical for these metrics, but useful for T3/T4 depending on context).
    const isImproved = invertLogic ? change.diff > 0 : change.diff < 0;
    
    return (
      <span className={`trend-indicator ${isImproved ? 'trend-improved' : 'trend-worsened'}`}>
        {change.diff < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
        {Math.abs(change.diff).toFixed(2)} ({Math.abs(change.percent).toFixed(1)}%)
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

  // Time elapsed
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
          <h2 id="modal-title">Assessment Comparison</h2>
          <div className="comparison-header-actions">
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleExportPDF}
              disabled={isExporting}
              aria-label="Download PDF Report"
            >
              <Download size={16} style={{marginRight: '6px'}} /> 
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button className="btn-icon-only" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body - This wrapper is what gets exported to PDF */}
        <div className="comparison-modal-body">
          <div className="pdf-export-wrapper" ref={pdfWrapperRef}>
            
            {/* Title for PDF (hidden in UI mostly, but good to have inside wrapper) */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Thyroid Health Comparison Report</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* Overall Progress Summary */}
            <div className="comparison-summary">
              <h3><Info size={18} /> Overall Progress Summary</h3>
              {generateSummary().map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Timeline & Risk Status */}
            <div className="comparison-timeline">
              <div className="timeline-point">
                <div className="timeline-date">
                  <Calendar size={14} style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                  {new Date(older.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', day: 'numeric' })}
                </div>
                <div>{getRiskBadge(older.risk_class)}</div>
              </div>
              
              <div className="timeline-arrow">
                <span style={{ fontSize: '1.5rem' }}>&rarr;</span>
                <span>{timeString}</span>
              </div>
              
              <div className="timeline-point">
                <div className="timeline-date">
                  <Calendar size={14} style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                  {new Date(newer.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', day: 'numeric' })}
                </div>
                <div>{getRiskBadge(newer.risk_class)}</div>
              </div>
            </div>

            {/* Enhanced Comparison Table */}
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Previous</th>
                    <th>Current</th>
                    <th>Change</th>
                    <th>Reference Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>TSH</strong></td>
                    <td>{older.tsh}</td>
                    <td>{newer.tsh}</td>
                    <td>{renderTrendIndicator(calculateChange(older.tsh, newer.tsh))}</td>
                    <td className="ref-range">0.4 - 4.0 mIU/L</td>
                  </tr>
                  <tr>
                    <td><strong>T3</strong></td>
                    <td>{older.t3}</td>
                    <td>{newer.t3}</td>
                    <td>{renderTrendIndicator(calculateChange(older.t3, newer.t3), true)}</td>
                    <td className="ref-range">1.2 - 3.1 nmol/L</td>
                  </tr>
                  <tr>
                    <td><strong>T4</strong></td>
                    <td>{older.t4}</td>
                    <td>{newer.t4}</td>
                    <td>{renderTrendIndicator(calculateChange(older.t4, newer.t4), true)}</td>
                    <td className="ref-range">60 - 160 nmol/L</td>
                  </tr>
                  <tr>
                    <td><strong>BMI</strong></td>
                    <td>{older.bmi.toFixed(1)}</td>
                    <td>{newer.bmi.toFixed(1)}</td>
                    <td>{renderTrendIndicator(calculateChange(older.bmi, newer.bmi))}</td>
                    <td className="ref-range">18.5 - 24.9</td>
                  </tr>
                  <tr>
                    <td><strong>Risk Score</strong></td>
                    <td>{(older.risk_score * 100).toFixed(0)}</td>
                    <td>{(newer.risk_score * 100).toFixed(0)}</td>
                    <td>{renderTrendIndicator(calculateChange(older.risk_score * 100, newer.risk_score * 100))}</td>
                    <td className="ref-range">&lt; 30 Low Risk</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                * Reference ranges may vary between laboratories and are provided for informational purposes only.
              </p>
            </div>

            {/* Recommendations Comparison */}
            <div className="recommendations-comparison">
              <h3>Lifestyle Recommendations Comparison</h3>
              <div className="rec-grid">
                <div className="rec-box">
                  <h4>Previous Recommendations</h4>
                  <ul className="rec-list">
                    {olderRecs.lifestyle?.map((rec: string, i: number) => (
                      <li key={i} className={!newerRecs.lifestyle?.includes(rec) ? 'rec-diff-removed' : ''}>
                        • {rec}
                      </li>
                    ))}
                    {!olderRecs.lifestyle?.length && <li>None</li>}
                  </ul>
                </div>
                <div className="rec-box">
                  <h4>Current Recommendations</h4>
                  <ul className="rec-list">
                    {newerRecs.lifestyle?.map((rec: string, i: number) => (
                      <li key={i} className={!olderRecs.lifestyle?.includes(rec) ? 'rec-diff-added' : ''}>
                        • {rec}
                      </li>
                    ))}
                    {!newerRecs.lifestyle?.length && <li>None</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div className="medical-disclaimer">
              <AlertCircle size={18} />
              <div>
                <strong>Medical Disclaimer:</strong> This comparison is generated by AI intended for informational purposes only and should not replace professional medical advice. Please consult a qualified healthcare provider regarding your thyroid health and treatment plan.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
