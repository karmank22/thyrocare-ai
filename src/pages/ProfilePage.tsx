import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    if (currentUser) {
      setPreferredName(currentUser.preferred_name);
    }
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

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-wrap container">
        <div className="profile-header animate-fadeInUp">
          <h1 className="profile-title">Profile Settings</h1>
          <p className="profile-subtitle">Manage your account and preferences</p>
        </div>

        <div className="glass-card profile-section animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <h2>👤 Personal Information</h2>
          <form onSubmit={handleUpdateName}>
            <div className="form-group profile-form-group">
              <label>Username (Cannot be changed)</label>
              <input type="text" className="form-control" value={currentUser?.username || ''} disabled />
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
            {nameStatus.error && <div className="alert alert-danger" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px' }}>{nameStatus.error}</div>}
            {nameStatus.success && <div className="alert alert-success" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,200,150,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0,200,150,0.3)' }}>{nameStatus.success}</div>}
            <button type="submit" className="btn btn-primary" disabled={nameStatus.loading} style={{ marginTop: '1rem' }}>
              {nameStatus.loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="glass-card profile-section animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2>🔒 Change Password</h2>
          <form onSubmit={handleUpdatePassword}>
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
              <small style={{ color: 'var(--text-muted)' }}>Must be at least 8 characters, include a number and a lowercase letter.</small>
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
            {passwordStatus.error && <div className="alert alert-danger" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px' }}>{passwordStatus.error}</div>}
            {passwordStatus.success && <div className="alert alert-success" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,200,150,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0,200,150,0.3)' }}>{passwordStatus.success}</div>}
            <button type="submit" className="btn btn-primary" disabled={passwordStatus.loading} style={{ marginTop: '1rem' }}>
              {passwordStatus.loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="glass-card profile-section danger-zone animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h2>⚠️ Danger Zone</h2>
          <p>Permanently delete your account and all associated health data. This action cannot be undone.</p>
          {deleteStatus.error && <div className="alert alert-danger" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px' }}>{deleteStatus.error}</div>}
          <div className="danger-actions">
            <button 
              className="btn btn-danger" 
              onClick={handleDeleteAccount}
              disabled={deleteStatus.loading}
            >
              {deleteStatus.loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
