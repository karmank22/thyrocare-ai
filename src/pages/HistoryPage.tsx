import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  // Comparison State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const sortedAssessments = [...assessments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

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

  const selectedAssessments = assessments.filter(a => selectedIds.includes(a.id));
  
  // Sort selected assessments chronologically for comparison (older vs newer)
  const chronologicalSelection = [...selectedAssessments].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-wrap container" style={{ marginTop: 'var(--space-2xl)' }}>
        
        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
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

        {loading ? (
          <div className="history-grid-css">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton glass-card" style={{ height: '180px' }}></div>
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div className="glass-card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📭</div>
            <h2>No History Found</h2>
            <p style={{ color: 'var(--text-muted)' }}>You haven't completed any assessments yet.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }} onClick={() => navigate('/screening')}>
              Start Screening
            </button>
          </div>
        ) : (
          <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {sortedAssessments.map(record => {
              const isSelected = selectedIds.includes(record.id);
              const isDisabled = !isSelected && selectedIds.length >= 2;
              
              return (
                <div 
                  key={record.id} 
                  className={`glass-card history-card ${isSelected ? 'selected' : ''}`} 
                  style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                    <div>
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
                  <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/assessment/${record.id}`)}>View Details</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

      {isModalOpen && chronologicalSelection.length === 2 && (
        <AssessmentComparisonModal 
          older={chronologicalSelection[0]} 
          newer={chronologicalSelection[1]} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
