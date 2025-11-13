import React, { useState, useEffect } from 'react';
import { EventOrganizerSidebar } from './OrganizerSidebar';
import OrganizerProfileModal from './OrganizerProfileModal';
import { getOrganizerProfile } from '../../services/authService';
import { decodeJWT } from '../../utils/jwt';

export function EventOrganizerLayout({ children }) {
  const [showModal, setShowModal] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [organizerId, setOrganizerId] = useState(null);

  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) return;

      let userData;
      try {
        userData = JSON.parse(userStr);
      } catch (e) {
        return;
      }

      const decoded = decodeJWT(token);
      if (!decoded || decoded.role !== 'EVENT_ORGANIZER') return;

      if (userData.status !== 'ACTIVE') {
        setStatusMessage('Your account is not active. Please contact support.');
        return;
      }

      const userId = userData.userId || userData.UserID;
      if (!userId) return;

      setUserEmail(userData.email || '');

      try {
        const response = await getOrganizerProfile(userId);
        if (response.success) {
          setProfileExists(true);
          setOrganizerId(response.data.organizerId);
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
    };

    checkProfile();
  }, []);

  const handleProfileCreated = () => {
    setShowModal(false);
    setProfileExists(true);
    // After creating profile, refetch to get organizerId
    // For now, assume it's set, or refetch
  };

  if (statusMessage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="alert alert-warning">{statusMessage}</div>
      </div>
    );
  }

  if (showModal) {
    return <OrganizerProfileModal isOpen={true} onSuccess={handleProfileCreated} userEmail={userEmail} />;
  }

  return (
    <div className="admin-layout">
      <EventOrganizerSidebar/>
      <main className="admin-main-content">
        {children}
      </main>
    </div>
  );
}