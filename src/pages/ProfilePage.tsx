import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertTriangle, Save, Trash2, Calendar, FileText, Clock } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL } from '../config';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, logout } = useApp();
  
  const [preferredName, setPreferredName] = useState(currentUser?.preferred_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nameStatus, setNameStatus] = useState({ loading: false, error: '', success: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' });
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: '' });
  
  // Stats state
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setPreferredName(currentUser.preferred_name);
    }
    
    // Fetch assessments for stats
    const fetchAssessments = async () => {
      const token = localStorage.getItem('thyrocare_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAssessments(data);
        }
      } catch (e) {
        console.error("Failed to load assessments for stats", e);
      }
    };
    
    fetchAssessments();
  }, [currentUser]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameStatus({ loading: true, error: '', success: '' });
    
    try {
      const token = localStorage.getItem('thyrocare_token');
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferred_name: preferredName })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUser(updatedUser);
        setNameStatus({ loading: false, error: '', success: 'Profile updated successfully!' });
      } else {
        const data = await res.json();
        setNameStatus({ loading: false, error: data.detail || 'Failed to update profile', success: '' });
      }
    } catch (err) {
      setNameStatus({ loading: false, error: 'Network error. Please try again.', success: '' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ loading: false, error: 'New passwords do not match', success: '' });
      return;
    }
    
    setPasswordStatus({ loading: true, error: '', success: '' });
    
    try {
      const token = localStorage.getItem('thyrocare_token');
      const res = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      
      if (res.ok) {
        setPasswordStatus({ loading: false, error: '', success: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        let errorMessage = data.detail || 'Failed to update password';
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => err.msg).join(', ');
        }
        setPasswordStatus({ loading: false, error: errorMessage, success: '' });
      }
    } catch (err) {
      setPasswordStatus({ loading: false, error: 'Network error. Please try again.', success: '' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your health assessments and data.")) {
      return;
    }
    
    setDeleteStatus({ loading: true, error: '' });
    
    try {
      const token = localStorage.getItem('thyrocare_token');
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        logout();
        navigate('/');
      } else {
        const data = await res.json();
        setDeleteStatus({ loading: false, error: data.detail || 'Failed to delete account' });
      }
    } catch (err) {
      setDeleteStatus({ loading: false, error: 'Network error. Please try again.' });
    }
  };

  const initial = currentUser?.preferred_name ? currentUser.preferred_name.charAt(0).toUpperCase() : 'U';

  // Calculate Stats
  const reportsUploaded = assessments.length;
  const sortedAssessments = [...assessments].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastAssessmentDate = sortedAssessments.length > 0 
    ? new Date(sortedAssessments[0].created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) 
    : 'None';
  const memberSinceDate = sortedAssessments.length > 0 
    ? new Date(sortedAssessments[sortedAssessments.length - 1].created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) 
    : 'Today';

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-wrap container">
        
        {/* Header Section with Avatar */}
        <div className="glass-card profile-header-card animate-fadeInUp">
          <div className="profile-header-top">
            <div className="profile-avatar">
              {initial}
            </div>
            <div>
              <h1 className="profile-title">{currentUser?.preferred_name}</h1>
              <p className="profile-subtitle">@{currentUser?.username} • {currentUser?.role === 'patient' ? 'Patient Portal' : 'Worker Portal'}</p>
              
              <div className="profile-stats-row">
                <div className="profile-stat-badge">
                  <Calendar size={14} /> Member since: <strong>{memberSinceDate}</strong>
                </div>
                <div className="profile-stat-badge">
                  <FileText size={14} /> Reports uploaded: <strong>{reportsUploaded}</strong>
                </div>
                <div className="profile-stat-badge">
                  <Clock size={14} /> Last assessment: <strong>{lastAssessmentDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          {/* Left Column: Personal Info */}
          <div className="glass-card profile-section animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h2>
              <span className="profile-section-icon"><User size={20} /></span>
              Personal Information
            </h2>
            <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="form-group profile-form-group">
                <label>Username</label>
                <input type="text" className="form-control" value={currentUser?.username || ''} disabled style={{ opacity: 0.7 }} />
              </div>
              <div className="form-group profile-form-group">
                <label>Preferred Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={preferredName} 
                  onChange={(e) => setPreferredName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-actions">
                {nameStatus.error && <div className="alert alert-danger mb-3">{nameStatus.error}</div>}
                {nameStatus.success && <div className="alert alert-success mb-3">{nameStatus.success}</div>}
                <button type="submit" className="btn btn-primary btn-icon" disabled={nameStatus.loading}>
                  <Save size={18} /> {nameStatus.loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Security */}
          <div className="glass-card profile-section animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <h2>
              <span className="profile-section-icon"><Lock size={20} /></span>
              Security Settings
            </h2>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="form-group profile-form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group profile-form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Min 8 chars, 1 number, 1 lowercase.</small>
              </div>
              <div className="form-group profile-form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-actions">
                {passwordStatus.error && <div className="alert alert-danger mb-3">{passwordStatus.error}</div>}
                {passwordStatus.success && <div className="alert alert-success mb-3">{passwordStatus.success}</div>}
                <button type="submit" className="btn btn-primary btn-icon" disabled={passwordStatus.loading}>
                  <Lock size={18} /> {passwordStatus.loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone spans full width below grid */}
        <div className="glass-card profile-section danger-zone animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h2>
            <span className="profile-section-icon"><AlertTriangle size={20} /></span>
            Danger Zone
          </h2>
          <p className="danger-text">
            Permanently delete your account and all associated health data. 
            This action <strong>cannot be undone</strong>. You will lose access to all your past thyroid assessments, trend charts, and generated insights immediately.
          </p>
          
          {deleteStatus.error && <div className="alert alert-danger mb-3">{deleteStatus.error}</div>}
          
          <div>
            <button 
              className="btn btn-danger btn-icon" 
              onClick={handleDeleteAccount}
              disabled={deleteStatus.loading}
            >
              <Trash2 size={18} /> {deleteStatus.loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
