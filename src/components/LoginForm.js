import React, { useState, useCallback } from 'react';
import { useFormik } from 'formik';
import { MailIcon } from './Icons';
import Input from './ui/Input';
import PasswordInput from './ui/PasswordInput';
import Button from './ui/Button';
import TabSwitcher from './ui/TabSwitcher';
import { validateForm } from '../utils/validation';
import { loginUser, registerUser, logoutUser, getCustomerProfile, getOrganizerProfile, createOrganizerProfile, getAdminProfile } from '../services/authService';
import Modal from './ui/Modal';
import SuccessModal from './ui/SuccessModal';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../utils/jwt';

function LoginForm({ onSuccess, adminOnly = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signIn');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ open: false, message: '', redirect: null, afterClose: null });
  const [pendingAuth, setPendingAuth] = useState(null);
  // Role state: mutable for signup (Customer vs Event Organizer). For sign-in we keep role fixed.
  const [role, setRole] = useState(adminOnly ? 'ADMIN' : 'CUSTOMER');

  const validate = useCallback(
    (values) => validateForm(values, activeTab),
    [activeTab]
  );

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '', // Add phone to initial values
    },
    validate,
    onSubmit: async (values, { setErrors, resetForm, setSubmitting }) => {
      setLoading(true);
      setSubmitting(true);

      try {
        let response;
        let successfulLoginRole = null;
        if (activeTab === 'signIn' || adminOnly) {
          // For sign-in, send email and password (role is handled by backend)
          if (adminOnly) {
            const loginRole = 'ADMIN';
            response = await loginUser(values.email, values.password);
            successfulLoginRole = loginRole;
          } else {
            response = await loginUser(values.email, values.password);
            // Role will be determined from response
          }
        } else {
          // For registration, send the selected role (CUSTOMER or EVENT_ORGANIZER)
          response = await registerUser(values.name, values.email, values.password, role, values.phone);

          if (!response.success && response.error && /invalid role/i.test(response.error)) {
            // Retry with alternate expected server role in case backend expects 'EVENT_MANAGER'
            try {
              const alternate = role === 'event_organizer' ? 'EVENT_MANAGER' : 'event_organizer';
              const retryResp = await registerUser(values.name, values.email, values.password, alternate);
              response = retryResp;
            } catch (e) {
              // ignore retry errors; original response will be handled
            }
          }
        }

        if (response.success) {
          // Determine a display role for the success message
          const displayRole = (activeTab === 'signIn' || adminOnly)
            ? (successfulLoginRole || ((response.data && (response.data.Role || response.data.role || response.data.RoleName)) || 'USER'))
            : role;
          // Show animated success modal and redirect after it closes
          const successText = activeTab === 'signIn' || adminOnly ? 'Login Successful!' : 'Registration Successful!';
          // If registration succeeded, after modal closes switch the tabs to signIn
          if (activeTab === 'signUp') {
            setSuccessModal({ open: true, message: successText, redirect: null, afterClose: 'switchToSignIn' });
          } else {
            setSuccessModal({ open: true, message: successText, redirect: null, afterClose: null });
          }
          resetForm();

          // Persist role and user data for routing
          if (activeTab === 'signIn' || adminOnly) {
            try {
              const payload = response.data || {};
              const userData = payload.user || {};
              // Support different casing/structures from backend
              const roleFromServer = userData.role || '';

              const roleToStore = roleFromServer ? roleFromServer.toUpperCase() : (adminOnly ? 'ADMIN' : 'CUSTOMER');

              // If adminOnly is required but server did not return ADMIN, show error and don't redirect
              if (adminOnly && roleToStore !== 'ADMIN') {
                setModal({ open: true, title: 'Access Denied', message: 'Account is not an admin.' });
                setLoading(false);
                setSubmitting(false);
                return;
              }

              localStorage.setItem('role', roleToStore);
              localStorage.setItem('token', payload.token || '');
              if (userData) localStorage.setItem('user', JSON.stringify(userData));

              // Set up customer or organizer specific data
              if (roleToStore === 'CUSTOMER') {
                localStorage.setItem('customerId', userData.id || userData.userId || userData.UserID || '');
                // Remove organizer profile data when signing in as customer
                localStorage.removeItem('organizerProfile');
                localStorage.removeItem('organizerId');
                // Fetch and store customer profile
                const customerId = userData.id || userData.userId || userData.UserID;
                if (customerId) {
                  try {
                    const resp = await getCustomerProfile(customerId);
                    if (resp.success) {
                      localStorage.setItem('customerProfile', JSON.stringify(resp.data));
                    }
                  } catch (e) {
                    // Ignore
                  }
                }
              } else if (roleToStore === 'EVENT_ORGANIZER' || roleToStore === 'EVENT_MANAGER' || roleToStore === 'ORGANIZER') {
                // Remove customer id when signing in as organizer
                localStorage.removeItem('customerId');
                localStorage.removeItem('customerProfile');
                
                // Fetch or create organizer profile automatically
                const userId = userData.id || userData.userId || userData.UserID;
                if (userId) {
                  try {
                    // First, try to get existing organizer profile
                    const organizerResp = await getOrganizerProfile(userId);
                    
                    if (organizerResp.success && organizerResp.data) {
                      // Organizer profile exists - store it
                      const organizerData = organizerResp.data;
                      localStorage.setItem('organizerId', organizerData.organizerId || organizerData.id || '');
                      localStorage.setItem('organizerProfile', JSON.stringify(organizerData));
                    } else {
                      // Organizer profile doesn't exist - create one
                      const newOrganizerProfile = {
                        userId: userId,
                        organizationName: userData.fullName || userData.name || 'Organization',
                        contactEmail: userData.email || '',
                        contactPhone: userData.phone || '',
                        description: '',
                        website: '',
                        address: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        country: ''
                      };
                      
                      const createResp = await createOrganizerProfile(newOrganizerProfile);
                      
                      if (createResp.success && createResp.data) {
                        // Store the newly created profile
                        const newOrganizerData = createResp.data;
                        localStorage.setItem('organizerId', newOrganizerData.organizerId || newOrganizerData.id || '');
                        localStorage.setItem('organizerProfile', JSON.stringify(newOrganizerData));
                      } else {
                        console.error('Failed to create organizer profile:', createResp.error);
                      }
                    }
                  } catch (e) {
                    console.error('Error handling organizer profile:', e);
                  }
                }
              } else if (roleToStore === 'ADMIN') {
                // Remove customer and organizer data when signing in as admin
                localStorage.removeItem('customerId');
                localStorage.removeItem('customerProfile');
                localStorage.removeItem('organizerId');
                localStorage.removeItem('organizerProfile');
                
                // Store admin-specific data
                const userId = userData.id || userData.userId || userData.UserID;
                if (userId) {
                  localStorage.setItem('adminId', userId);
                  
                  try {
                    // Try to fetch admin profile
                    const adminResp = await getAdminProfile(userId);
                    
                    if (adminResp.success && adminResp.data) {
                      // Admin profile exists - store it
                      localStorage.setItem('adminProfile', JSON.stringify(adminResp.data));
                    } else {
                      // Admin profile doesn't exist - store user data as admin profile
                      const adminProfile = {
                        userId: userId,
                        fullName: userData.fullName || userData.name || 'Admin User',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        role: 'ADMIN',
                        status: userData.status || 'ACTIVE'
                      };
                      localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
                    }
                  } catch (e) {
                    console.error('Error handling admin profile:', e);
                    // Store basic user data as admin profile
                    const adminProfile = {
                      userId: userId,
                      fullName: userData.fullName || userData.name || 'Admin User',
                      email: userData.email || '',
                      phone: userData.phone || '',
                      role: 'ADMIN',
                      status: userData.status || 'ACTIVE'
                    };
                    localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
                  }
                }
              }

              // Save pending auth event to dispatch after success modal closes
              setPendingAuth({ user: userData, token: payload.token });
              // determine redirect path now the role is known and attach it to the success modal
              let redirectPath = '/userprofile';
              const up = (roleToStore || '').toString().toUpperCase();
              if (up === 'ADMIN') redirectPath = '/admin';
              else if (up === 'EVENT_MANAGER' || up === 'EVENT_ORGANIZER' || up === 'ORGANIZER') redirectPath = '/organizer';
              // update success modal to include redirect after it has been shown
              setSuccessModal((s) => ({ ...(s || {}), redirect: redirectPath }));
            } catch (e) {
              // ignore storage errors
            }

            // parent handler will be called after the success modal closes
            // store response so we can call it later
            const parentCallback = typeof onSuccess === 'function' ? onSuccess : null;
            // attach to pendingAuth so it can be invoked after modal
            setPendingAuth((p) => ({ ...(p || {}), parentCallback, rawResponse: response }));
          }
          // No auto-login after signup
        } else {
          // Map backend error to appropriate form field using Formik's setErrors
          const serverError = response.error || response.rawText || (response.data && response.data._raw) || 'Registration failed';
          // If backend indicates duplicate email, show error on email field
          if (/email/i.test(serverError) && /exist|already/i.test(serverError)) {
            setErrors({ email: 'Email already exists' });
          } else if (/password/i.test(serverError)) {
            setErrors({ password: serverError });
          } else {
            // Fallback: show a modal with the server error and also set a generic field error
            setModal({ open: true, title: 'Registration Error', message: serverError });
            setErrors({ password: serverError });
          }
        }
      } catch (error) {
        setErrors({ password: 'An unexpected error occurred' });
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const handleTabChange = (newTab) => setActiveTab(newTab);

  const handleSignOut = async () => {
    try {
      const response = await logoutUser();
      // clear stored role/user using centralized function
      clearAuthData();
      setModal({
        open: true,
        title: response.success ? 'Signed Out' : 'Sign Out Failed',
        message: response.success ? 'Signed out successfully.' : 'Sign out failed.',
      });
      // navigate to home after sign out
      navigate('/');
    } catch {
      setModal({ open: true, title: 'Network Error', message: 'Network error during sign out.' });
    }
  };

  return (
    <div className="auth-card">
      <Modal
        isOpen={modal.open}
        title={modal.title}
        onClose={() => setModal({ ...modal, open: false })}
        hideHeader
      >
        <div style={{ padding: '1rem', textAlign: 'center' }}>{modal.message}</div>
      </Modal>
      <SuccessModal
        visible={successModal.open}
        message={successModal.message}
        duration={2300}
        onClose={() => {
          const after = successModal && successModal.afterClose;
          setSuccessModal({ open: false, message: '', redirect: null, afterClose: null });
          // dispatch pending auth event (if any) and call parent callback
          if (pendingAuth) {
            try {
              window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: pendingAuth.user, token: pendingAuth.token } }));
            } catch (e) {}
            if (pendingAuth.parentCallback) {
              try { pendingAuth.parentCallback(pendingAuth.rawResponse); } catch (e) {}
            }
            setPendingAuth(null);
          }
          // If this success was from registration, switch the tab back to signIn
          if (after === 'switchToSignIn') {
            setActiveTab('signIn');
          }
          if (successModal.redirect) navigate(successModal.redirect, { replace: true });
        }}
      />
      {/* Only show tab switcher if not adminOnly */}
      {!adminOnly && (
        <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} disabled={loading} />
      )}

      <div className="form-container">
        <h3>{adminOnly ? 'Admin Login' : activeTab === 'signIn' ? 'Sign in to your account' : 'Create a new account'}</h3>
        <p className="form-intro">
          {adminOnly
            ? 'Enter your admin credentials to access the admin dashboard.'
            : activeTab === 'signIn'
            ? 'Enter your email and password to access your account'
            : 'Get started by creating your account'}
        </p>

        {/* No role selector for user login/signup */}

        <form onSubmit={formik.handleSubmit} noValidate>
          {/* Name field only for signUp and not adminOnly */}
          {!adminOnly && activeTab === 'signUp' && (
            <>
              <div className="mb-3">
                <label className="form-label d-block">Account type</label>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="accountType"
                    id="roleCustomer"
                    value="CUSTOMER"
                    checked={role === 'CUSTOMER'}
                    onChange={() => setRole('CUSTOMER')}
                  />
                  <label className="form-check-label" htmlFor="roleCustomer">Customer</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="accountType"
                    id="roleOrganizer"
                    value="EVENT_ORGANIZER"
                    checked={role === 'EVENT_ORGANIZER'}
                    onChange={() => setRole('EVENT_ORGANIZER')}
                  />
                  <label className="form-check-label" htmlFor="roleOrganizer">Event Organizer</label>
                </div>
              </div>
              <Input
                id="name"
                name="name"
                label="Name"
                placeholder="John Doe"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.name}
                touched={formik.touched.name}
                disabled={loading}
                required
              />
              <Input
                id="phone"
                name="phone"
                label="Phone Number"
                placeholder="Enter your phone number"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.phone}
                touched={formik.touched.phone}
                disabled={loading}
                required
              />
            </>
          )}

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="john@example.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email}
            icon={<MailIcon />}
            disabled={loading}
            required
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.password}
            touched={formik.touched.password}
            disabled={loading}
            required
          />

          {/* Confirm password only for signUp and not adminOnly */}
          {!adminOnly && activeTab === 'signUp' && (
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.confirmPassword}
              touched={formik.touched.confirmPassword}
              disabled={loading}
              required
            />
          )}

          {/* Forgot password only for signIn and not adminOnly */}
          {!adminOnly && activeTab === 'signIn' && (
            <div className="form-options">
              <button
                type="button"
                className="forgot-password"
                onClick={() => setModal({ open: true, title: 'Coming Soon', message: 'Forgot password functionality not implemented yet.' })}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="full"
            loading={loading}
            disabled={formik.isSubmitting || Object.keys(formik.errors).length > 0}
          >
            {adminOnly ? 'Sign In' : activeTab === 'signIn' ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
