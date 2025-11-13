import React, { useState } from 'react';
import { useFormik } from 'formik';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { createOrganizerProfile, logoutUser } from '../../services/authService';
import { clearAuthData } from '../../utils/jwt';

const OrganizerProfileModal = ({ isOpen, onSuccess, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const formik = useFormik({
    initialValues: {
      organisationName: '',
      contactPerson: '',
      contactPersonPhone: '',
      email: userEmail || '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.organisationName) errors.organisationName = 'Required';
      if (!values.contactPerson) errors.contactPerson = 'Required';
      if (!values.contactPersonPhone) errors.contactPersonPhone = 'Required';
      if (!values.email) errors.email = 'Required';
      return errors;
    },
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        const response = await createOrganizerProfile(values);
        if (response.success) {
          // Store the created profile in localStorage
          if (response.data) {
            localStorage.setItem('organizerProfile', JSON.stringify(response.data));
            if (response.data.organizerId) {
              localStorage.setItem('organizerId', response.data.organizerId);
            }
          }
          // Call onSuccess callback if provided
          if (typeof onSuccess === 'function') {
            onSuccess(response.data);
          }
          setShowSuccessModal(true);
        } else {
          setError(response.error || 'Failed to create profile');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleLogoutAndRedirect = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // Clear all auth data using centralized function
    clearAuthData();
    // redirect to signin page
    window.location.href = '/login';
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // Clear all auth data using centralized function
    clearAuthData();
    // notify other parts of the app
    try {
      window.dispatchEvent(new Event('auth:logout'));
    } catch (e) {}
    // redirect to home
    window.location.href = '/';
  };

  return (
    <>
      <Modal isOpen={isOpen && !showSuccessModal} title="Complete Your Organizer Profile" hideHeader>
        <div style={{ padding: '1rem' }}>
          <p>Please fill in your organizer details to continue.</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={formik.handleSubmit}>
            <Input
              id="organisationName"
              name="organisationName"
              label="Organization Name"
              placeholder="Enter organization name"
              value={formik.values.organisationName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.organisationName}
              touched={formik.touched.organisationName}
              disabled={loading}
              required
            />
            <Input
              id="contactPerson"
              name="contactPerson"
              label="Contact Person"
              placeholder="Enter contact person name"
              value={formik.values.contactPerson}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.contactPerson}
              touched={formik.touched.contactPerson}
              disabled={loading}
              required
            />
            <Input
              id="contactPersonPhone"
              name="contactPersonPhone"
              label="Contact Person Phone"
              placeholder="Enter phone number"
              value={formik.values.contactPersonPhone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.contactPersonPhone}
              touched={formik.touched.contactPersonPhone}
              disabled={loading}
              required
            />
            <Input
              id="email"
              name="email"
              label="Email"
              placeholder="Enter email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.email}
              touched={formik.touched.email}
              disabled={loading}
              required
            />
            <Button type="submit" variant="primary" loading={loading}>
              Create Profile
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSignOut}
              style={{ marginLeft: '10px' }}
            >
              Sign Out
            </Button>
          </form>
        </div>
      </Modal>

      <Modal isOpen={showSuccessModal} title="Profile Created" hideHeader>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="mb-3">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="mb-3">Profile Created Successfully!</h5>
          <p className="text-muted mb-4">Your organizer profile has been created successfully.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Continue
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default OrganizerProfileModal;
