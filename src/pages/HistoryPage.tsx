import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Download, Filter, X, CheckCircle, AlertCircle, FileText, Activity } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import Navbar from '../components/common/Navbar';
import { API_BASE_URL } from '../config';
import AssessmentComparisonModal from '../components/dashboard/AssessmentComparisonModal';
import './HistoryPage.css';

export interface AssessmentRecord {
  id: string;
  created_at: string;
  model_version: string;
  risk_class: string;
  risk_score: number;
  emergency_flag: boolean;
  tsh: number;
  t3: number;
  t4: number;
  bmi: number;
  age: number;
  recommendations_json: string | null;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Assessments');
  
  // Comparison State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Deletion Modal State
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Download State
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfAssessment, setPdfAssessment] = useState<AssessmentRecord | null>(null);

  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('thyrocare_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAssessments(data);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  // Handle PDF Generation Effect
  useEffect(() => {
    if (pdfAssessment && pdfRef.current) {
      const generatePDF = async () => {
        try {
          const opt = {
            margin: 10,
            filename: `ThyroCare_Assessment_${new Date(pdfAssessment.created_at).toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          await html2pdf().from(pdfRef.current).set(opt).save();
          showToast('Assessment report downloaded successfully.', 'success');
        } catch (err) {
          showToast('Failed to generate PDF. Please try again.', 'error');
        } finally {
          setIsDownloadingId(null);
          setPdfAssessment(null);
        }
      };
      
      // Small timeout to ensure the DOM updates before snapshot
      setTimeout(() => {
        generatePDF();
      }, 100);
    }
  }, [pdfAssessment]);

  // Filtering Logic
  const getFilteredAssessments = () => {
    let filtered = [...assessments];

    // Text Search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.id.toLowerCase().includes(lowerQuery) ||
        a.risk_class.toLowerCase().includes(lowerQuery) ||
        new Date(a.created_at).toLocaleDateString().includes(lowerQuery)
      );
    }

    // Date Filter
    if (dateFilter !== 'All Assessments') {
      const now = new Date();
      filtered = filtered.filter(a => {
        const d = new Date(a.created_at);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'Today') return diffDays <= 1;
        if (dateFilter === 'Last 7 Days') return diffDays <= 7;
        if (dateFilter === 'Last 30 Days') return diffDays <= 30;
        if (dateFilter === 'Last 6 Months') return diffDays <= 180;
        return true;
      });
    }

    // Sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const filteredAssessments = getFilteredAssessments();

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('All Assessments');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalId) return;
    const id = deleteModalId;
    
    setIsDeletingId(id);
    setDeleteModalId(null);
    
    const token = localStorage.getItem('thyrocare_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok || res.status === 204) {
        setAssessments(prev => prev.filter(a => a.id !== id));
        setSelectedIds(prev => prev.filter(selId => selId !== id));
        showToast('Assessment deleted successfully.', 'success');
      } else {
        showToast('Failed to delete assessment. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network error. Failed to delete assessment.', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDownloadInitiate = (record: AssessmentRecord) => {
    if (isDownloadingId) return; // Prevent multiple downloads
    setIsDownloadingId(record.id);
    setPdfAssessment(record);
  };

  const getRiskBadge = (riskClass: string, emergencyFlag: boolean) => {
    if (emergencyFlag) return <span className="badge badge-danger">🚨 Emergency</span>;
    switch (riskClass) {
      case 'Normal': return <span className="badge badge-success">✅ Normal</span>;
      case 'Mild': return <span className="badge badge-warning">🟡 Mild</span>;
      case 'Moderate': return <span className="badge badge-orange">🟠 Moderate</span>;
      case 'High': return <span className="badge badge-danger">🔴 High Risk</span>;
      default: return <span className="badge">{riskClass}</span>;
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length < 2) {
          return [...prev, id];
        }
        return prev;
      }
    });
  };

  // Keyboard trap for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteModalId) setDeleteModalId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [deleteModalId]);

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-wrap container" style={{ marginTop: 'var(--space-2xl)' }}>
        
        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div>
            <span className="section-label">Records</span>
            <h1 style={{ fontSize: '32px', margin: 0 }}>Assessment History</h1>
            <p style={{ color: 'var(--text-muted)' }}>View and track all your previous AI thyroid screenings.</p>
          </div>
          <div>
            <select 
              className="form-input" 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)' }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="history-controls">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="history-search-input" 
              placeholder="Search by assessment date, risk level, or assessment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="history-filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="All Assessments">All Assessments</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 6 Months">Last 6 Months</option>
          </select>
          
          {(searchQuery || dateFilter !== 'All Assessments') && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              <Filter size={16} /> Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="history-grid-css" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton glass-card" style={{ height: '120px' }}></div>
            ))}
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="glass-card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              <FileText size={64} style={{ opacity: 0.5 }} />
            </div>
            <h2>No assessments match your search</h2>
            <p style={{ color: 'var(--text-muted)' }}>Try changing your search term or clearing the applied filters.</p>
            {(searchQuery || dateFilter !== 'All Assessments') && (
              <button className="btn btn-secondary" style={{ marginTop: 'var(--space-md)' }} onClick={handleClearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {filteredAssessments.map(record => {
              const isSelected = selectedIds.includes(record.id);
              const isDisabled = !isSelected && selectedIds.length >= 2;
              
              return (
                <div 
                  key={record.id} 
                  className={`glass-card history-card ${isSelected ? 'selected' : ''}`} 
                  style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                  onClick={() => !isDisabled && handleToggleSelection(record.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="checkbox-custom"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggleSelection(record.id)}
                        aria-label="Select for comparison"
                      />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                        {new Date(record.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '18px' }}>Assessment ID: {record.id.substring(0, 8)}...</strong>
                        {getRiskBadge(record.risk_class, record.emergency_flag)}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        <span>🧠 AI Engine: {record.model_version}</span>
                        <span>Confidence: {(record.risk_score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="history-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleDownloadInitiate(record)}
                      disabled={isDownloadingId === record.id}
                      aria-label="Download Assessment"
                    >
                      <Download size={16} style={{ marginRight: '6px' }} />
                      {isDownloadingId === record.id ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }}
                      onClick={() => setDeleteModalId(record.id)}
                      disabled={isDeletingId === record.id}
                      aria-label="Delete Assessment"
                    >
                      <Trash2 size={16} style={{ marginRight: '6px' }} />
                      {isDeletingId === record.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Action Bar */}
      {selectedIds.length > 0 && (
        <div className="compare-action-bar">
          <div className={`compare-action-text ${selectedIds.length === 1 ? 'error' : ''}`}>
            {selectedIds.length === 1 
              ? 'Select one more assessment to begin comparison.' 
              : 'Two assessments selected for comparison.'}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds([])}>
              Cancel
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              disabled={selectedIds.length !== 2}
              onClick={() => setIsModalOpen(true)}
            >
              Compare Assessments
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isModalOpen && (
        <AssessmentComparisonModal 
          older={filteredAssessments.filter(a => selectedIds.includes(a.id)).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]} 
          newer={filteredAssessments.filter(a => selectedIds.includes(a.id)).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[1]} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* Custom Deletion Modal */}
      {deleteModalId && (
        <div className="custom-modal-overlay" onClick={() => setDeleteModalId(null)} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header">
              <AlertCircle size={22} color="#ef4444" />
              <h3 id="delete-modal-title">Delete Assessment</h3>
            </div>
            <div className="custom-modal-body">
              <p>Are you sure you want to delete this assessment? This action is permanent and cannot be undone.</p>
            </div>
            <div className="custom-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModalId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete Assessment</button>
            </div>
          </div>
        </div>
      )}

      {/* Localized Toast Container */}
      {toast && (
        <div className="toast-container" aria-live="polite">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {toast.message}
            <button style={{ background: 'none', border: 'none', color: 'white', marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setToast(null)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Hidden PDF Output Template */}
      {pdfAssessment && (
        <div className="pdf-export-hidden">
          <div className="pdf-template" ref={pdfRef}>
            <div className="pdf-header">
              <Activity size={32} color="#3b82f6" style={{ marginBottom: '12px' }} />
              <h1>Clinical Assessment Report</h1>
              <p>ThyroCare AI • Generated {new Date().toLocaleDateString()}</p>
            </div>

            <div className="pdf-section">
              <h2>Patient & Assessment Details</h2>
              <table className="pdf-table">
                <tbody>
                  <tr>
                    <th>Assessment Date</th>
                    <td>{new Date(pdfAssessment.created_at).toLocaleString()}</td>
                    <th>Assessment ID</th>
                    <td>{pdfAssessment.id}</td>
                  </tr>
                  <tr>
                    <th>Age</th>
                    <td>{pdfAssessment.age || 'N/A'}</td>
                    <th>AI Model Version</th>
                    <td>{pdfAssessment.model_version}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-section">
              <h2>Clinical Biomarkers</h2>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Reference Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>TSH</strong> (Thyroid Stimulating Hormone)</td>
                    <td>{pdfAssessment.tsh.toFixed(2)} mIU/L</td>
                    <td>0.4 - 4.0 mIU/L</td>
                  </tr>
                  <tr>
                    <td><strong>T3</strong> (Triiodothyronine)</td>
                    <td>{pdfAssessment.t3.toFixed(2)} nmol/L</td>
                    <td>1.2 - 3.1 nmol/L</td>
                  </tr>
                  <tr>
                    <td><strong>T4</strong> (Thyroxine)</td>
                    <td>{pdfAssessment.t4.toFixed(2)} nmol/L</td>
                    <td>60 - 160 nmol/L</td>
                  </tr>
                  <tr>
                    <td><strong>BMI</strong></td>
                    <td>{pdfAssessment.bmi.toFixed(1)}</td>
                    <td>18.5 - 24.9</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-section">
              <h2>Risk Analysis</h2>
              <table className="pdf-table">
                <tbody>
                  <tr>
                    <th>Risk Classification</th>
                    <td style={{ fontWeight: 'bold', color: pdfAssessment.risk_class === 'Normal' ? '#10b981' : '#ef4444' }}>
                      {pdfAssessment.risk_class} {pdfAssessment.emergency_flag ? '(EMERGENCY)' : ''}
                    </td>
                  </tr>
                  <tr>
                    <th>AI Risk Score</th>
                    <td>{(pdfAssessment.risk_score * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {pdfAssessment.recommendations_json && (
              <div className="pdf-section">
                <h2>AI Recommendations</h2>
                {(() => {
                  try {
                    const recs = JSON.parse(pdfAssessment.recommendations_json);
                    return (
                      <div>
                        {recs.lifestyle && recs.lifestyle.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <strong style={{ fontSize: '14px', color: '#4b5563' }}>Lifestyle & Diet:</strong>
                            <ul className="pdf-text" style={{ marginTop: '8px', paddingLeft: '20px' }}>
                              {recs.lifestyle.map((r: string, i: number) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  } catch (e) {
                    return <p className="pdf-text">Recommendations data unavailable.</p>;
                  }
                })()}
              </div>
            )}

            <div className="pdf-footer">
              <p><strong>Medical Disclaimer:</strong> This assessment was generated by an AI model and is intended for informational purposes only. It should not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider regarding any medical condition or before making health-related decisions.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
