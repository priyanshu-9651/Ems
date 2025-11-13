import 'bootstrap/dist/css/bootstrap.min.css';
import { CalendarIcon } from './Icons';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/LoginForm.css';
import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import LoginForm from './LoginForm';
import { UserIcon } from './Icons';
import { logoutUser } from '../services/authService';

const Navbar = () => {
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Get the profile link based on role
  const getProfileLink = () => {
    const role = localStorage.getItem('role');
    if (role === 'ADMIN') return '/admin';
    if (role === 'EVENT_MANAGER' || role === 'EVENT_ORGANIZER') return '/organizer';
    return '/userprofile';
  };

  const openUserModal = () => setUserModalOpen(true);
  const closeUserModal = () => setUserModalOpen(false);
  const openAdminModal = () => setAdminModalOpen(true);
  const closeAdminModal = () => setAdminModalOpen(false);

  const handleAuthSuccess = (response) => {
    // response shape: { success, status, data, error }
    if (response && response.success) {
      setUser(response.data || response);
    }
    closeUserModal();
    closeAdminModal();
  };

  useEffect(() => {
    const onGlobalLogout = () => {
      setUser(null);
      navigate('/');
    };
    window.addEventListener('auth:logout', onGlobalLogout);
    const onGlobalLogin = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(stored);
      } catch (e) {}
    };
    window.addEventListener('auth:login', onGlobalLogin);
    return () => window.removeEventListener('auth:logout', onGlobalLogout);
  }, [navigate]);

  useEffect(() => {
    // read any existing user at mount
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      if (stored) setUser(stored);
    } catch (e) {}
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // clear stored role and user
    try {
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
    setUser(null);
    // notify other parts of the app (some components listen for this)
    try {
      window.dispatchEvent(new Event('auth:logout'));
    } catch (e) {}
    // Force a navigation to home page and reload to ensure clean state
    window.location.href = '/';
  };

  return (
    <header className="main-header bg-light shadow-sm">
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <CalendarIcon />
            <span className="ms-2 fw-bold">EventHub</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/EventsPage" className="nav-link">
                  Events
                </Link>
              </li>
            </ul>

            <div className="d-flex align-items-center">
              {/* Hide Admin button if user is signed in */}
              {!user && (
                <button className="btn btn-outline-dark me-2" onClick={openAdminModal}>
                  Admin
                </button>
              )}
              {!user ? (
                <button className="btn btn-outline-secondary" onClick={openUserModal}>
                  Sign in
                </button>
              ) : (
                <>
                  <Link to={getProfileLink()} className="btn btn-outline-primary me-2">
                    <UserIcon />
                  </Link>
                  <button className="btn btn-outline-danger" onClick={handleSignOut}>
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Admin Login Modal */}
      <Modal isOpen={adminModalOpen} title="Admin Login" onClose={closeAdminModal}>
        <LoginForm onSuccess={handleAuthSuccess} adminOnly />
      </Modal>
      {/* User Sign In/Up Modal */}
      <Modal isOpen={userModalOpen} title="Sign in or Sign up" onClose={closeUserModal}>
        <LoginForm onSuccess={handleAuthSuccess} />
      </Modal>
    </header>
  );
};

export default Navbar;
