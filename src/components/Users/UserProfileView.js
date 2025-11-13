import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, MapPin } from 'lucide-react';
import UserProfileEdit from './UserProfileEdit';
import { getCustomerProfile, createCustomerProfile } from '../../services/authService';
import { getCustomerBookings, getEventById } from '../../services/eventService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const UserProfileView = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const defaults = {
            email: 'john.doe@example.com',
            upcomingEvents: 0,
            eventsAttended: 2,
        };
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...defaults, ...parsed };
            }
        } catch (e) {
            // ignore parse errors
        }
        return defaults;
    });

    const [profileExists, setProfileExists] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [customerProfileModal, setCustomerProfileModal] = useState({ open: false, userId: null, loading: false });
    const [profileForm, setProfileForm] = useState({
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        gender: '',
        dob: '',
        anniversary: ''
    });
    const [successModal, setSuccessModal] = useState(false);
    const [customerProfile, setCustomerProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [events, setEvents] = useState({});
    const [activeTab, setActiveTab] = useState('upcoming');

    const hasUpcomingEvents = (user?.upcomingEvents || 0) > 0;

    // Safely compute initials when name may be missing or malformed
    const initials = (user && (user.name || user.fullName)) ? String(user.name || user.fullName).split(' ').map(n => n[0] || '').join('') : 'U';

    useEffect(() => {
        const checkProfile = async () => {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) {
                setCheckingProfile(false);
                return;
            }
            try {
                const resp = await getCustomerProfile(customerId);
                if (resp.success) {
                    setProfileExists(true);
                } else {
                    setCustomerProfileModal({ open: true, userId: customerId, loading: false });
                }
            } catch (e) {
                setCustomerProfileModal({ open: true, userId: customerId, loading: false });
            }
            setCheckingProfile(false);
        };
        checkProfile();
    }, []);

    useEffect(() => {
        // Check if profile already in localStorage
        const existingProfile = localStorage.getItem('customerProfile');
        if (existingProfile) {
            setProfileExists(true);
            setCheckingProfile(false);
            return;
        }
    }, []);

    useEffect(() => {
        // Load customer profile from localStorage
        try {
            const profile = localStorage.getItem('customerProfile');
            if (profile) {
                setCustomerProfile(JSON.parse(profile));
            }
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!customerProfile?.customerId) return;

            try {
                const response = await getCustomerBookings(customerProfile.customerId);
                if (response.success && response.data) {
                    setBookings(response.data);

                // Fetch event details for each unique event
                const uniqueEventIds = [...new Set(response.data.map(booking => booking.eventId))];
                const eventPromises = uniqueEventIds.map(eventId => getEventById(eventId));
                const eventResponses = await Promise.all(eventPromises);

                const eventsMap = {};
                eventResponses.forEach((resp, index) => {
                    if (resp.success && resp.data) {
                        eventsMap[uniqueEventIds[index]] = resp.data;
                    }
                });
                setEvents(eventsMap);                    // Update upcoming and past events count based on event start date
                    const currentDate = new Date();
                    const upcomingCount = response.data.filter(booking => {
                        const event = eventsMap[booking.eventId];
                        if (!event?.eventStartDate) return true; // If no date, count as upcoming
                        const eventDate = new Date(event.eventStartDate);
                        return eventDate >= currentDate;
                    }).length;
                    
                    const pastCount = response.data.length - upcomingCount;

                    // Update user stats
                    setUser(prev => ({
                        ...prev,
                        upcomingEvents: upcomingCount,
                        eventsAttended: pastCount
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
            }
        };

        fetchBookings();
    }, [customerProfile]);

    useEffect(() => {
        // listen for updates from the booking flow in same window
        const onUserUpdated = (e) => {
            const updated = e?.detail || null;
            if (updated) setUser((prev) => ({ ...prev, ...updated }));
            else {
                try {
                    const raw = localStorage.getItem('user');
                    if (raw) setUser(JSON.parse(raw));
                } catch (err) {}
            }
        };

        // listen for storage events (other tabs)
        const onStorage = (e) => {
            if (e.key === 'user') {
                try {
                    const v = e.newValue ? JSON.parse(e.newValue) : null;
                    if (v) setUser((prev) => ({ ...prev, ...v }));
                } catch (err) {}
            }
        };

        window.addEventListener('userUpdated', onUserUpdated);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('userUpdated', onUserUpdated);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // Edit modal visibility
    const [showEdit, setShowEdit] = useState(false);

    const openEdit = () => setShowEdit(true);
    const closeEdit = () => setShowEdit(false);

    // Prevent background scroll while modal is open and restore on close
    useEffect(() => {
        if (showEdit) {
            // Remember current overflow and padding
            const prevOverflow = document.body.style.overflow;
            const prevPaddingRight = document.body.style.paddingRight;
            document.body.style.overflow = 'hidden';
            // avoid layout shift when scrollbar disappears
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
            return () => {
                document.body.style.overflow = prevOverflow || '';
                document.body.style.paddingRight = prevPaddingRight || '';
            };
        }
        return undefined;
    }, [showEdit]);

    const handleSave = (updated) => {
        // update local state with saved values
        setUser((prev) => ({ ...prev, ...updated }));
        // localStorage is already updated by the modal, but ensure consistency
        try { localStorage.setItem('user', JSON.stringify({ ...user, ...updated })); } catch (e) {}
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setCustomerProfileModal({ ...customerProfileModal, loading: true });
        const data = {
            customerId: 0,
            userId: customerProfileModal.userId,
            ...profileForm
        };
        try {
            const resp = await createCustomerProfile(data);
            if (resp.success) {
                // Store organizer details in localStorage
                localStorage.setItem('customerProfile', JSON.stringify(resp.data));
                setCustomerProfileModal({ open: false, userId: null, loading: false });
                setSuccessModal(true);
            } else {
                alert(resp.error);
                setCustomerProfileModal({ ...customerProfileModal, loading: false });
            }
        } catch (e) {
            alert('Failed to create profile');
            setCustomerProfileModal({ ...customerProfileModal, loading: false });
        }
    };

    const handleSignOut = async () => {
        try {
            // Clear stored data
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('customerId');
            localStorage.removeItem('customerProfile');
            localStorage.removeItem('organizerProfile');
            localStorage.removeItem('organizerId');
            // Redirect to signin
            window.location.href = '/signin';
        } catch (e) {
            console.error('Sign out error', e);
        }
    };

    useEffect(() => {
        if (successModal) {
            const timer = setTimeout(() => {
                handleSignOut();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [successModal]);

    if (checkingProfile) {
        return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>Loading...</div>;
    }

    if (!profileExists) {
        return (
            <Modal
                isOpen={customerProfileModal.open}
                title="Complete Your Customer Profile"
                hideHeader
            >
                <form onSubmit={handleProfileSubmit}>
                    <Input
                        label="Address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        required
                    />
                    <Input
                        label="City"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        required
                    />
                    <Input
                        label="State"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        required
                    />
                    <Input
                        label="Zip Code"
                        value={profileForm.zipCode}
                        onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                        required
                    />
                    <Input
                        label="Country"
                        value={profileForm.country}
                        onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                        required
                    />
                    <Input
                        label="Gender"
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        required
                    />
                    <Input
                        label="Date of Birth"
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        required
                    />
                    <Input
                        label="Anniversary"
                        type="date"
                        value={profileForm.anniversary}
                        onChange={(e) => setProfileForm({ ...profileForm, anniversary: e.target.value })}
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        size="full"
                        loading={customerProfileModal.loading}
                    >
                        Create Profile
                    </Button>
                </form>
            </Modal>
        );
    }

    return (
        <>
            <Modal
                isOpen={successModal}
                title="Profile Created"
                hideHeader
            >
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="mb-3">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h5 className="mb-3">Profile Created Successfully!</h5>
                    <p className="text-muted mb-4">Your customer profile has been created. You will now be logged out. Please sign in again.</p>
                </div>
            </Modal>
            <div className="container py-4" style={{ maxWidth: '1200px' }}>
                {/* Profile Header Card */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                                padding: '2rem 0',
                                position: 'relative'
                            }}>
                                <div className="card-body text-white">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <div 
                                                className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow"
                                                style={{ width: '100px', height: '100px' }}
                                            >
                                                <span className="text-primary fw-bold" style={{ fontSize: '2.5rem' }}>{initials}</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h2 className="mb-2 fw-bold">{user?.name || user?.fullName || 'User'}</h2>
                                            <p className="mb-2 opacity-75">
                                                <i className="bi bi-envelope me-2"></i>
                                                {user?.email || ''}
                                            </p>
                                            <span className="badge bg-success bg-opacity-75 px-3 py-2">
                                                <i className="bi bi-check-circle me-1"></i>
                                                Active Member
                                            </span>
                                        </div>
                                        <div className="col-auto">
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-light" onClick={openEdit}>
                                                    <i className="bi bi-person me-2"></i>
                                                    View Profile
                                                </button>
                                                <button className="btn btn-warning text-white" onClick={() => navigate('/userbookings')}>
                                                    <i className="bi bi-ticket-perforated me-2"></i>
                                                    My Bookings
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row mb-4 g-4">
                    <div className="col-md-6">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center">
                                    <div 
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        }}
                                    >
                                        <Calendar size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold">{user.upcomingEvents}</h3>
                                        <p className="text-muted mb-0">Upcoming Events</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center">
                                    <div 
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                        }}
                                    >
                                        <CheckCircle2 size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold">{user.eventsAttended}</h3>
                                        <p className="text-muted mb-0">Events Attended</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Bookings Section */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0 pt-4 px-4">
                                <h5 className="mb-3 fw-bold">
                                    <i className="bi bi-calendar-event me-2"></i>
                                    My Event Bookings
                                </h5>
                                <ul className="nav nav-pills mb-0">
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`} 
                                            onClick={() => setActiveTab('upcoming')}
                                            style={{
                                                borderRadius: '8px',
                                                ...(activeTab === 'upcoming' ? {
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: 'none'
                                                } : {})
                                            }}
                                        >
                                            <i className="bi bi-clock-history me-2"></i>
                                            Upcoming ({bookings.filter(b => {
                                                const bookingDate = new Date(b.createdAt);
                                                return bookingDate >= new Date();
                                            }).length})
                                        </button>
                                    </li>
                                    <li className="nav-item ms-2">
                                        <button 
                                            className={`nav-link ${activeTab === 'past' ? 'active' : ''}`} 
                                            onClick={() => setActiveTab('past')}
                                            style={{
                                                borderRadius: '8px',
                                                ...(activeTab === 'past' ? {
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: 'none'
                                                } : {})
                                            }}
                                        >
                                            <i className="bi bi-calendar-check me-2"></i>
                                            Past ({bookings.filter(b => {
                                                const bookingDate = new Date(b.createdAt);
                                                return bookingDate < new Date();
                                            }).length})
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div className="card-body p-4">
                                {(() => {
                                    const currentDate = new Date();
                                    const filteredBookings = bookings.filter(booking => {
                                        const event = events[booking.eventId];
                                        if (!event?.eventStartDate) return activeTab === 'upcoming'; // If no date, show in upcoming
                                        const eventDate = new Date(event.eventStartDate);
                                        return activeTab === 'upcoming' ? eventDate >= currentDate : eventDate < currentDate;
                                    });

                                    if (filteredBookings.length === 0) {
                                        return (
                                            <div className="text-center py-5">
                                                <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.2 }}>
                                                    <Calendar size={64} />
                                                </div>
                                                <h4 className="text-muted mb-3">No {activeTab} events</h4>
                                                <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                                                    {activeTab === 'upcoming' 
                                                        ? 'Ready to discover something amazing? Browse our events and book your next experience!' 
                                                        : 'Your past bookings will appear here once you attend events.'
                                                    }
                                                </p>
                                                {activeTab === 'upcoming' && (
                                                    <button className="btn btn-primary px-4 py-2" onClick={() => navigate('/EventsPage')}>
                                                        <i className="bi bi-search me-2"></i>
                                                        Explore Events
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="row g-3">
                                            {filteredBookings.map((booking) => {
                                                const event = events[booking.eventId];
                                                const formatSeats = (tickets) => {
                                                    if (!tickets || !Array.isArray(tickets)) return 'N/A';
                                                    return tickets.map(ticket => ticket.seatNumber).join(', ');
                                                };
                                                return (
                                                    <div key={booking.bookingId} className="col-12">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                                                            <div className="card-body p-3">
                                                                <div className="row align-items-center">
                                                                    <div className="col-md-8">
                                                                        <h6 className="mb-2 fw-bold">{booking.eventName || `Event ${booking.eventId}`}</h6>
                                                                        <div className="d-flex flex-wrap gap-3 text-muted small">
                                                                            <span>
                                                                                <MapPin size={14} className="me-1" />
                                                                                {event?.eventLocation || 'Venue not available'}
                                                                            </span>
                                                                            <span>
                                                                                <Calendar size={14} className="me-1" />
                                                                                {event?.eventStartDate 
                                                                                    ? new Date(event.eventStartDate).toLocaleDateString('en-US', {
                                                                                        year: 'numeric',
                                                                                        month: 'short',
                                                                                        day: 'numeric'
                                                                                    })
                                                                                    : 'Date not available'
                                                                                }
                                                                            </span>
                                                                            <span>
                                                                                <i className="bi bi-clock me-1"></i>
                                                                                {event?.eventStartDate 
                                                                                    ? new Date(event.eventStartDate).toLocaleTimeString('en-US', {
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit'
                                                                                    })
                                                                                    : 'Time not available'
                                                                                }
                                                                                {event?.eventEndDate && (
                                                                                    <> - {new Date(event.eventEndDate).toLocaleTimeString('en-US', {
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit'
                                                                                    })}</>
                                                                                )}
                                                                            </span>
                                                                            <span>
                                                                                <i className="bi bi-ticket-perforated me-1"></i>
                                                                                {booking.ticketsQuantity} Ticket{booking.ticketsQuantity > 1 ? 's' : ''}
                                                                            </span>
                                                                        </div>
                                                                        <div className="mt-2">
                                                                            <span className="badge bg-light text-dark border">
                                                                                Seats: {formatSeats(booking.tickets)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                                                                        <div className="mb-2">
                                                                            <span className="h5 fw-bold text-primary mb-0">Rs. {booking.totalAmount || 'N/A'}</span>
                                                                        </div>
                                                                        {booking.bookingStatus === 'COMPLETED' && (
                                                                            <span className="badge bg-success px-3 py-2">
                                                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                                                COMPLETED
                                                                            </span>
                                                                        )}
                                                                        {booking.bookingStatus === 'CONFIRMED' && (
                                                                            <span className="badge px-3 py-2" style={{ backgroundColor: '#90EE90', color: '#155724' }}>
                                                                                <i className="bi bi-check-circle me-1"></i>
                                                                                CONFIRMED
                                                                            </span>
                                                                        )}
                                                                        {booking.bookingStatus === 'PENDING' && (
                                                                            <span className="badge bg-warning text-dark px-3 py-2">
                                                                                <i className="bi bi-clock me-1"></i>
                                                                                PENDING
                                                                            </span>
                                                                        )}
                                                                        {booking.bookingStatus === 'CANCELLED' && (
                                                                            <span className="badge bg-danger px-3 py-2">
                                                                                <i className="bi bi-x-circle me-1"></i>
                                                                                CANCELLED
                                                                            </span>
                                                                        )}
                                                                        {!booking.bookingStatus && (
                                                                            <span className="badge bg-secondary px-3 py-2">UNKNOWN</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Profile Details Section */}
                {customerProfile && (
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-header border-0 pt-4 px-4" style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                }}>
                                    <h5 className="mb-0 text-white fw-bold">
                                        <i className="bi bi-person-badge me-2"></i>
                                        Personal Information
                                    </h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-4">
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-geo-alt-fill" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">Address</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.address || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-building" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">City</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.city || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-map" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">State</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.state || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-mailbox" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">Zip Code</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.zipCode || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-globe" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">Country</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.country || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-gender-ambiguous" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">Gender</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.gender || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-cake2" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">Date of Birth</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.dob ? new Date(customerProfile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-heart-fill" style={{ fontSize: '1.5rem' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <label className="text-muted small mb-1">Anniversary</label>
                                                    <p className="mb-0 fw-medium">{customerProfile.anniversary ? new Date(customerProfile.anniversary).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit modal */}
                {showEdit && (
                    <UserProfileEdit
                        user={user}
                        onClose={closeEdit}
                        onSave={(updated) => { handleSave(updated); closeEdit(); }}
                    />
                )}

                {/* Success modal */}
                {successModal && (
                    <Modal
                        isOpen={successModal}
                        title="Profile Created"
                        onClose={() => setSuccessModal(false)}
                    >
                        <div className="text-center py-4">
                            <div className="mb-3" style={{ fontSize: '3rem', color: '#28a745' }}>
                                <CheckCircle2 size={48} />
                            </div>
                            <h4 className="mb-3">Success!</h4>
                            <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                Your profile has been successfully created. You can now enjoy personalized features and event recommendations.
                            </p>
                        </div>
                    </Modal>
                )}
            </div>
        </>
    );
};

export default UserProfileView;