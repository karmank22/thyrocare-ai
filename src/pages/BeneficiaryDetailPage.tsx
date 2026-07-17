import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { API_BASE_URL } from '../config';

export default function BeneficiaryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [referralStatus, setReferralStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      const token = localStorage.getItem('thyrocare_token');
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAssessment(data);
          setReferralStatus(data.referral_status || 'Not Referred');
          setNotes(data.follow_up_notes || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('thyrocare_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments/${id}/referral`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          referral_status: referralStatus,
          follow_up_notes: notes
        })
      });
      if (res.ok) {
        alert('Beneficiary updated successfully.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '100px'}}><div className="spinner" /></div>;
  if (!assessment) return <div style={{textAlign: 'center', marginTop: '100px'}}><h2>Beneficiary Not Found</h2><button className="btn btn-secondary" onClick={() => navigate('/worker-dashboard')}>Back to Dashboard</button></div>;

  return (
    <div className="worker-page">
      <Navbar />
      <div className="container" style={{ marginTop: 'var(--space-xl)' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/worker-dashboard')} style={{ marginBottom: 'var(--space-md)' }}>
          ← Back to Beneficiary List
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          <div>
            <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
              <h2>👤 Demographics</h2>
              <p><strong>Name:</strong> {assessment.patient_name || 'Anonymous'}</p>
              <p><strong>Mobile:</strong> {assessment.patient_mobile || 'N/A'}</p>
              <p><strong>Village:</strong> {assessment.patient_village || 'N/A'}</p>
              <p><strong>Age:</strong> {assessment.age}</p>
              <p><strong>BMI:</strong> {assessment.bmi}</p>
              <p><strong>Screening Date:</strong> {new Date(assessment.created_at).toLocaleDateString()}</p>
            </div>

            <div className="glass-card">
              <h2>🔬 Clinical Findings</h2>
              <p><strong>TSH:</strong> {assessment.tsh || 'Not Tested'} mIU/L</p>
              <p><strong>Symptoms Reported:</strong></p>
              <ul>
                {assessment.fatigue && <li>Fatigue</li>}
                {assessment.weight_gain && <li>Weight Gain</li>}
                {assessment.hair_fall && <li>Hair Fall</li>}
                {assessment.menstrual_irregularity && <li>Menstrual Irregularity</li>}
              </ul>
              <p><strong>Risk Score:</strong> {(assessment.risk_score * 100).toFixed(0)}% ({assessment.risk_class})</p>
            </div>
          </div>

          <div>
            <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
              <h2>🏥 Referral & Follow-up</h2>
              <div className="form-group">
                <label className="form-label">Referral Status</label>
                <select className="form-input" value={referralStatus} onChange={(e) => setReferralStatus(e.target.value)}>
                  <option value="Not Referred">Not Referred</option>
                  <option value="Referred to PHC">Referred to PHC</option>
                  <option value="Referred to CHC">Referred to CHC</option>
                  <option value="Referred to Specialist">Referred to Specialist</option>
                  <option value="Follow-up Completed">Follow-up Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Notes</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  placeholder="e.g., Patient advised to visit PHC, medication started..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
            
            <div className="glass-card">
              <h2>💡 AI Recommendations</h2>
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>
                {assessment.recommendations_json 
                  ? JSON.parse(assessment.recommendations_json).lifestyle?.join('\n') 
                  : "No specific recommendations generated."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
