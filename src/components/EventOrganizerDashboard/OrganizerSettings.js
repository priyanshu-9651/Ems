import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../Icons';
import { logoutUser, getOrganizerProfile } from '../../services/authService';
import { decodeJWT, clearAuthData } from '../../utils/jwt';
import OrganizerProfileModal from './OrganizerProfileModal';

export function EventOrganizerSettings() {
  const navigate = useNavigate();
  const [avatarImage, setAvatarImage] = useState(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        setCheckingProfile(false);
        return;
      }

      let userData;
      try {
        userData = JSON.parse(userStr);
      } catch (e) {
        setCheckingProfile(false);
        return;
      }

      const decoded = decodeJWT(token);
      if (!decoded || decoded.role !== 'EVENT_ORGANIZER') {
        setCheckingProfile(false);
        return;
      }

      if (userData.status !== 'ACTIVE') {
        setCheckingProfile(false);
        return;
      }

      const userId = userData.userId || userData.UserID;
      if (!userId) {
        setCheckingProfile(false);
        return;
      }

      setUserEmail(userData.email || '');

      // Check if profile already in localStorage
      const existingProfile = localStorage.getItem('organizerProfile');
      if (existingProfile) {
        setProfileExists(true);
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await getOrganizerProfile(userId);
        if (response.success) {
          setProfileExists(true);
          // Store organizer details in localStorage
          localStorage.setItem('organizerProfile', JSON.stringify(response.data));
          localStorage.setItem('organizerId', response.data.organizerId);
        } else if (response.status === 404) {
          setShowModal(true);
        } else {
          console.error('Profile check failed:', response);
        }
      } catch (e) {
        console.error('Profile check error:', e);
      }
      setCheckingProfile(false);
    };

    checkProfile();
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    // Handle profile update logic here
    alert('Profile updated successfully!');
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAvatarChange = () => {
    document.getElementById('avatar-input').click();
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // Clear stored role and user using centralized function
    clearAuthData();
    // Navigate to home page
    navigate('/');
  };

  if (checkingProfile) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  if (showModal) {
    return <OrganizerProfileModal isOpen={true} onSuccess={() => { setShowModal(false); setProfileExists(true); }} userEmail={userEmail} />;
  }

  if (!profileExists) {
    return <div>Profile not found.</div>; // or something
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Settings & Profile</h1>
          <p className="text-muted mb-0">Manage your profile, team members, and notification preferences.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-outline-danger"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Profile Information */}
        <div className="col-12 col-lg-6">
          <div className="settings-section">
            <div className="settings-section-header">
              <h5 className="settings-section-title">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Profile Information
              </h5>
            </div>
            <div className="settings-section-body">
              <div className="avatar-section">
                <div className="profile-avatar">
                  {avatarImage ? (
                    <img 
                      src={avatarImage} 
                      alt="Profile Avatar"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                      onError={() => setAvatarImage(null)}
                    />
                  ) : (
                    <div className="avatar-placeholder">AU</div>
                  )}
                </div>
                <div className="avatar-buttons">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={triggerAvatarChange}
                    type="button"
                  >
                    Change Avatar
                  </button>
                  {avatarImage && (
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setAvatarImage(null)}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-floating">
                      <input 
                        type="text" 
                        className="form-control" 
                        id="fullName" 
                        defaultValue="Admin User"
                      />
                      <label htmlFor="fullName">Full Name</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <input 
                        type="email" 
                        className="form-control" 
                        id="email" 
                        defaultValue="admin@eventmanager.com"
                      />
                      <label htmlFor="email">Email</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <input 
                        type="tel" 
                        className="form-control" 
                        id="phone" 
                        defaultValue="+1 (555) 123-4567"
                      />
                      <label htmlFor="phone">Phone</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary">
                      Update Profile
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="col-12 col-lg-6">
          <div className="settings-section">
            <div className="settings-section-header">
              <h5 className="settings-section-title">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Notification Preferences
              </h5>
            </div>
            <div className="settings-section-body">
              <div className="notification-item">
                <div className="notification-info">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <h6>Email Notifications</h6>
                  </div>
                  <p>Receive event updates and task notifications</p>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="emailNotifications"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <h6>SMS Notifications</h6>
                  </div>
                  <p>Urgent alerts and reminders</p>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="smsNotifications"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                  />
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <h6>Push Notifications</h6>
                  </div>
                  <p>Browser and app notifications</p>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="pushNotifications"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h6>Marketing Updates</h6>
                  </div>
                  <p>Product updates and newsletter</p>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="marketingUpdates"
                    checked={marketingUpdates}
                    onChange={(e) => setMarketingUpdates(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Management Section */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="settings-section-title">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Team Management
            </h5>
            <button className="btn btn-primary">
              + Invite Member
            </button>
          </div>
          <p className="text-muted mb-0">Manage team members and their roles</p>
        </div>
      </div>
    </div>
  );
}