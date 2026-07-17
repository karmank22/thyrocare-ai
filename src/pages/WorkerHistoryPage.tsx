import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { API_BASE_URL } from '../config';
import { getOfflineAssessments, deleteOfflineAssessment, saveOfflineAssessment } from '../services/offlineSync';
import './WorkerHistoryPage.css';

export default function WorkerHistoryPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterDate, setFilterDate] = useState('All');

  const fetchAssessments = async () => {
    const token = localStorage.getItem('thyrocare_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();
        // Sort newest first
        data = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this screening? This action cannot be undone.")) return;
    
    const token = localStorage.getItem('thyrocare_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAssessments(assessments.filter(a => a.id !== id));
      } else {
        alert("Failed to delete assessment.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while deleting.");
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = 
      (a.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.patient_village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.patient_mobile || '').includes(searchTerm);
      
    let matchesRisk = true;
    if (filterRisk !== 'All') {
      if (filterRisk === 'Pending Referral') matchesRisk = a.referral_status === 'Not Referred' && (a.risk_class === 'High' || a.risk_class === 'Critical' || a.risk_class === 'Moderate');
      else if (filterRisk === 'Referred') matchesRisk = a.referral_status !== 'Not Referred';
      else matchesRisk = a.risk_class === filterRisk;
    }

    let matchesDate = true;
    if (filterDate !== 'All') {
      const assessmentDate = new Date(a.created_at);
      const now = new Date();
      const diffDays = (now.getTime() - assessmentDate.getTime()) / (1000 * 3600 * 24);
      if (filterDate === 'Today') matchesDate = diffDays < 1;
      else if (filterDate === 'Last 7 Days') matchesDate = diffDays <= 7;
      else if (filterDate === 'Last 30 Days') matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesRisk && matchesDate;
  });

  return (
    <div className="worker-dashboard">
      <Navbar />
      <div className="container" style={{ marginTop: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h1>👥 Assessment History</h1>
          <button className="btn btn-primary" onClick={() => navigate('/worker')}>+ New Screening</button>
        </div>

        {offlineCount > 0 && (
          <div className="glass-card" style={{ marginBottom: 'var(--space-lg)', borderColor: 'var(--risk-mild)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Offline Queue</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You have {offlineCount} screenings waiting to be synced to the server.</p>
              </div>
              <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}

        <div className="glass-card">
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Beneficiary Name, Mobile..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ flex: 1 }}
            />
            <select className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px' }}>
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <select className="form-input" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ width: '180px' }}>
              <option value="All">All Statuses</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Mild">Low Risk (Mild)</option>
              <option value="Normal">Normal</option>
              <option value="Pending Referral">Pending Referral</option>
              <option value="Referred">Referred</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><div className="spinner" /></div>
          ) : filteredAssessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
              <h3>No Assessments Yet</h3>
              <p>You haven't completed any beneficiary screenings matching these filters.</p>
              <button className="btn btn-primary" onClick={() => navigate('/worker')} style={{ marginTop: 'var(--space-md)' }}>Start New Screening</button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="beneficiary-table">
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>Date & Time</th>
                    <th>Age</th>
                    <th>TSH</th>
                    <th>Risk Class</th>
                    <th>Referral</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.patient_name || 'Anonymous'}</td>
                      <td>{new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>{a.age}</td>
                      <td>{a.tsh ? `${a.tsh} mIU/L` : '-'}</td>
                      <td>
                        <span className={`risk-badge risk-${a.risk_class?.toLowerCase()}`}>{a.risk_class}</span>
                      </td>
                      <td>
                        <span className={`ref-badge ${a.referral_status === 'Not Referred' ? 'ref-none' : 'ref-done'}`}>{a.referral_status || 'Not Referred'}</span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/beneficiary/${a.id}`)}>Details</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--risk-high)', borderColor: 'var(--risk-high)' }}>Delete</button>
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
