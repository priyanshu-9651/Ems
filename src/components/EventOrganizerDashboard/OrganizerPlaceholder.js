import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../Icons';
import { logoutUser } from '../../services/authService';

export function EventOrganizerPlaceholder() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    try {
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    } catch (e) {}
    navigate('/');
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Reports & Analytics</h1>
          <p className="text-muted mb-0">WORKING ON IT....</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/settings')}
            title="Profile Settings"
          >
            <UserIcon />
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="coming-soon-container">
        <div className="coming-soon-icon">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="coming-soon-subtitle">
          WORKING ON ITT.....
        </p>
        <div className="mt-4">
          <span className="badge bg-primary fs-6 px-3 py-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}