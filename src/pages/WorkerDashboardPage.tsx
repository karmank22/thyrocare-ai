import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { API_BASE_URL } from '../config';
import { getOfflineAssessments, deleteOfflineAssessment, saveOfflineAssessment } from '../services/offlineSync';
import './WorkerDashboardPage.css';

export default function WorkerDashboardPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');

  const fetchAssessments = async () => {
    const token = localStorage.getItem('thyrocare_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkOffline = async () => {
    const records = await getOfflineAssessments();
    setOfflineCount(records.length);
  };

  useEffect(() => {
    fetchAssessments();
    checkOffline();
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine) {
      alert("You are still offline. Please connect to internet to sync.");
      return;
    }
    setSyncing(true);
    const token = localStorage.getItem('thyrocare_token');
    const records = await getOfflineAssessments();
    
    let successCount = 0;
    for (const record of records) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(record.data)
        });
        if (res.ok) {
          await deleteOfflineAssessment(record.id);
          successCount++;
        }
      } catch (e) {
        console.error("Sync failed for", record.id);
      }
    }
    setSyncing(false);
    if (successCount > 0) {
      alert(`Successfully synced ${successCount} screenings!`);
      fetchAssessments();
      checkOffline();
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = 
      (a.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.patient_village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.patient_mobile || '').includes(searchTerm);
      
    const matchesRisk = filterRisk === 'All' || a.risk_class === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const highRiskCount = assessments.filter(a => a.risk_class === 'High' || a.risk_class === 'Critical').length;
  const pendingReferrals = assessments.filter(a => (a.risk_class === 'High' || a.risk_class === 'Critical') && a.referral_status === 'Not Referred').length;

  return (
    <div className="worker-dashboard">
      <Navbar />
      <div className="container" style={{ marginTop: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h1>👥 Beneficiary Dashboard</h1>
          <button className="btn btn-primary" onClick={() => navigate('/worker')}>+ New Screening</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Screened</h3>
            <div className="stat-value">{assessments.length}</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--risk-high)' }}>
            <h3>High Risk</h3>
            <div className="stat-value" style={{ color: 'var(--risk-high)' }}>{highRiskCount}</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--risk-moderate)' }}>
            <h3>Pending Referrals</h3>
            <div className="stat-value" style={{ color: 'var(--risk-moderate)' }}>{pendingReferrals}</div>
          </div>
          <div className="stat-card" style={{ borderColor: offlineCount > 0 ? 'var(--risk-mild)' : 'var(--border-color)' }}>
            <h3>Offline Queue</h3>
            <div className="stat-value">{offlineCount}</div>
            {offlineCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={handleSync} disabled={syncing} style={{ marginTop: '10px' }}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ marginTop: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Name, Village, Mobile..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ flex: 1 }}
            />
            <select className="form-input" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ width: '200px' }}>
              <option value="All">All Risks</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Mild">Mild Risk</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><div className="spinner" /></div>
          ) : filteredAssessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
              <h3>No Beneficiaries Found</h3>
              <p>Complete your first screening to begin tracking community health assessments.</p>
              <button className="btn btn-primary" onClick={() => navigate('/worker')} style={{ marginTop: 'var(--space-md)' }}>Start New Screening</button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="beneficiary-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Village</th>
                    <th>Risk Score</th>
                    <th>Referral Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.patient_name || 'Anonymous'}</td>
                      <td>{new Date(a.created_at).toLocaleDateString()}</td>
                      <td>{a.patient_village || 'N/A'}</td>
                      <td>
                        <span className={`risk-badge risk-${a.risk_class?.toLowerCase()}`}>{a.risk_class}</span>
                      </td>
                      <td>
                        <span className={`ref-badge ${a.referral_status === 'Not Referred' ? 'ref-none' : 'ref-done'}`}>{a.referral_status || 'Not Referred'}</span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/beneficiary/${a.id}`)}>View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
