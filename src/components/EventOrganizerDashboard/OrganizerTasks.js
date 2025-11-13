import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../Icons';
import { logoutUser } from '../../services/authService';

export function EventOrganizerTasks() {
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
    } catch (e) {
     
    }
   
    navigate('/');
  };

  return (
    <div className="p-4">
     
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Tasks Management</h1>
          <p className="text-muted mb-0">WORKING ON ITT....</p>
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
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="coming-soon-subtitle">
         WORKING ON ITTTT...
        </p>
        <div className="mt-4">
          <span className="badge bg-primary fs-6 px-3 py-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}