import React, { useEffect } from 'react';
import LoginForm from './components/LoginForm';
import './styles/global.css';
import './styles/LoginForm.css';
import './styles/admin.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import FilterBar from './components/events/user/FilterBar';
import EventsPage from './components/events/user/EventsPage';
import EventDetails from './components/events/user/EventDetails';
import TicketBookingInterface from './components/events/user/TicketBookingInterface';
import TicketBookingPage from './components/events/user/TicketBookingPage';
import EventForm from './components/events/admin/EventForm';
import Navbar from './components/navbar';
import { CalendarIcon } from './components/Icons';
import Home from './components/home/HomePage';
import Footer from './components/home/Footer';
import UserProfileView from './components/Users/UserProfileView';
import AdminUserManagement from './components/AdminDashboard/AdminUserManagement';
import { AdminLayout  } from './components/AdminDashboard/AdminLayout';
import { AdminDashboard  } from './components/AdminDashboard/AdminDashboard';
import { AdminEvents  } from './components/AdminDashboard/AdminEvents';
import { AdminSettings } from './components/AdminDashboard/AdminSettings';
import { AdminFinancePage } from './components/AdminDashboard/AdminRevenue';
import { EventOrganizerLayout } from './components/EventOrganizerDashboard/OrganizerLayout';
import { EventOrganizerDashboard } from './components/EventOrganizerDashboard/OrganizerDashboard';
import { EventOrganizerTasks } from './components/EventOrganizerDashboard/OrganizerTasks';
import { EventOrganizerSettings } from './components/EventOrganizerDashboard/OrganizerSettings';
import { EventOrganizerSidebar } from './components/EventOrganizerDashboard/OrganizerSidebar';
import { EventOrganizerPlaceholder } from './components/EventOrganizerDashboard/OrganizerPlaceholder';
import { EventOrganizerEvents } from './components/EventOrganizerDashboard/EventsOrganizer';
import { AdminCreateEvent } from './components/AdminDashboard/AdminCreateEvent';
import { OrganizerCreateEvent } from './components/EventOrganizerDashboard/OrganizerCreateEvent';
import { OrganizerBookings } from './components/EventOrganizerDashboard/OrganizerBookings';
import UserBookings from './components/Users/UserBookings';
import { setupTokenExpiryMonitor } from './utils/jwt';

function App() {
  useEffect(() => {
    // Set up automatic token expiry monitoring
    const cleanup = setupTokenExpiryMonitor();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  
  // Validate token on every route change
  useEffect(() => {
    const { validateAndCleanupToken } = require('./utils/jwt');
    validateAndCleanupToken();
  }, [location.pathname]);
  
  const isAdminRoute = () => {
    // Hide the site chrome (Navbar/Footer) on admin and organizer areas, but not on login pages
    const p = location.pathname || '';
    return (p.startsWith('/admin') || p.startsWith('/organizer')) && !p.includes('/login');
  };

  return (
    <>
     
      {!isAdminRoute() && <Navbar />}
      <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/EventsPage" element={<EventsPage />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/book/:id" element={<TicketBookingPage />} />
            <Route path="/login" element={<LoginForm />} />
            {/* <Route path="/admin" element={<LoginForm />} /> */}
            {/* <Route path="/addevent" element={<EventForm />} /> */}
            <Route path="/admin/login" element={<LoginForm adminOnly={true} />} />

            
            <Route
              path="/admin"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'ADMIN') ? (
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/admin/events"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'ADMIN') ? (
                  <AdminLayout>
                    <AdminEvents />
                  </AdminLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/admin/create-event"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'ADMIN') ? (
                  <AdminCreateEvent />
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/admin/revenue"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'ADMIN') ? (
                  <AdminLayout>
                    <AdminFinancePage/>
                  </AdminLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/admin/settings"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'ADMIN') ? (
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/admin/organizermanagement"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'ADMIN') ? (
                  <AdminLayout>
                    <AdminUserManagement />
                  </AdminLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/userprofile"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'CUSTOMER') ? (
                  <UserProfileView />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/organizer"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <EventOrganizerDashboard />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/organizer/events"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <EventOrganizerEvents />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/organizer/create-event"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <OrganizerCreateEvent />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/organizer/tasks"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <EventOrganizerTasks />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/organizer/bookings"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <OrganizerBookings />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/organizer/settings"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <EventOrganizerSettings />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/organizer/reports"
              element={
                (localStorage.getItem('role') && (localStorage.getItem('role').toUpperCase() === 'EVENT_MANAGER' || localStorage.getItem('role').toUpperCase() === 'EVENT_ORGANIZER')) ? (
                  <EventOrganizerLayout>
                    <EventOrganizerPlaceholder />
                  </EventOrganizerLayout>
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />
            <Route
              path="/userbookings"
              element={
                (localStorage.getItem('role') && localStorage.getItem('role').toUpperCase() === 'CUSTOMER') ? (
                  <UserBookings />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {!isAdminRoute() && <Footer />}
    </>
  );
}

export default App;
