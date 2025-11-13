import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { clearAuthData } from '../../utils/jwt';
import { completeBooking } from '../../services/eventService';

export function OrganizerBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [completingBookingId, setCompletingBookingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [selectedEvent]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const organizerId = localStorage.getItem('organizerId');
      if (!organizerId) {
        setError('Organizer ID not found');
        setLoading(false);
        return;
      }

      let url = `http://localhost:8080/organizer/bookings/organizer/${organizerId}`;
      
      if (selectedEvent && selectedEvent !== 'all') {
        url += `/event/${selectedEvent}`;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Bookings data received:', data); // Debug log
      
      // Process bookings - backend returns nested event object
      let bookingsData = Array.isArray(data) ? data : [];
      
      // Transform bookings to flatten event data
      bookingsData = bookingsData.map(booking => ({
        ...booking,
        eventId: booking.event?.eventId || booking.eventId,
        eventName: booking.event?.eventName || booking.eventName || `Event #${booking.event?.eventId || 'Unknown'}`,
        eventStartDate: booking.event?.eventStartDate || booking.eventStartDate,
        eventEndDate: booking.event?.eventEndDate || booking.eventEndDate,
        customerName: booking.customer?.user?.fullName || 'Unknown Customer',
        customerEmail: booking.customer?.user?.email || '',
        customerPhone: booking.customer?.user?.phone || '',
        customerId: booking.customer?.customerId || null
      }));

      // Fetch detailed ticket information for each unique customer
      const uniqueCustomerIds = [...new Set(bookingsData.map(b => b.customerId).filter(id => id))];
      const customerTicketsMap = {};

      for (const customerId of uniqueCustomerIds) {
        try {
          const ticketsResponse = await fetch(`http://localhost:8080/customer/api/bookings/customer/${customerId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (ticketsResponse.ok) {
            const ticketsData = await ticketsResponse.json();
            console.log(`Tickets data for customer ${customerId}:`, ticketsData); // Debug log
            
            // The API returns data directly as an array, not wrapped in success/data
            const bookingsArray = Array.isArray(ticketsData) ? ticketsData : 
                                 (ticketsData.success && ticketsData.data ? ticketsData.data : []);
            
            // Create a map of bookingId to detailed tickets
            bookingsArray.forEach(booking => {
              if (booking.tickets && Array.isArray(booking.tickets)) {
                customerTicketsMap[booking.bookingId] = booking.tickets;
                console.log(`Mapped tickets for booking ${booking.bookingId}:`, booking.tickets); // Debug log
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching tickets for customer ${customerId}:`, err);
        }
      }

      console.log('Customer tickets map:', customerTicketsMap); // Debug log

      // Merge detailed ticket information into bookings
      bookingsData = bookingsData.map(booking => ({
        ...booking,
        tickets: customerTicketsMap[booking.bookingId] || booking.tickets || []
      }));
      
      setBookings(bookingsData);
      
      // Extract unique events from bookings
      const uniqueEvents = [...new Map(bookingsData.map(booking => 
        [booking.eventId, { id: booking.eventId, name: booking.eventName }]
      )).values()].filter(event => event.id); // Filter out events without valid IDs
      
      setEvents(uniqueEvents);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // Clear all auth data using centralized function
    clearAuthData();
    navigate('/');
  };

  const handleCompleteBooking = async (bookingId, bookingStatus) => {
    // Check if booking is confirmed
    if (bookingStatus !== 'CONFIRMED') {
      alert('Only confirmed bookings can be marked as completed.');
      return;
    }

    if (!window.confirm('Are you sure you want to mark this booking as completed?')) {
      return;
    }

    try {
      setCompletingBookingId(bookingId);
      const response = await completeBooking(bookingId);
      
      if (response.success) {
        // Refresh bookings to show updated status
        await fetchBookings();
        alert('Booking marked as completed successfully!');
      } else {
        alert(response.error || 'Failed to complete booking. Please try again.');
      }
    } catch (err) {
      console.error('Error completing booking:', err);
      alert('Failed to complete booking. Please try again.');
    } finally {
      setCompletingBookingId(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const eventName = booking.eventName || '';
    const bookingIdStr = (booking.bookingId || '').toString();
    
    const matchesSearch = searchTerm === '' || 
      eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookingIdStr.includes(searchTerm);
    
    const matchesStatus = statusFilter === '' || booking.bookingStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getTotalRevenue = () => {
    return filteredBookings.reduce((sum, booking) => sum + booking.totalAmount, 0).toFixed(2);
  };

  const getTotalTickets = () => {
    return filteredBookings.reduce((sum, booking) => sum + booking.ticketsQuantity, 0);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchBookings}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h3 mb-1">Event Bookings</h1>
          <p className="text-muted mb-0">View and manage all bookings for your events</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/organizer/dashboard')}
          >
            <i className="bi bi-house"></i> Dashboard
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/organizer/events')}
          >
            <i className="bi bi-calendar-event"></i> Events
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/organizer/settings')}
          >
            <i className="bi bi-person"></i>
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Bookings</h6>
              <h3 className="mb-0">{filteredBookings.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Tickets Sold</h6>
              <h3 className="mb-0">{getTotalTickets()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Revenue</h6>
              <h3 className="mb-0">Rs. {getTotalRevenue()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by event name or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Event</label>
              <select
                className="form-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="all">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Booking ID</th>
                  <th>Event Name</th>
                  <th>Event Date & Time</th>
                  <th>Customer Details</th>
                  <th>Tickets</th>
                  <th>Seats</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Booking Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.bookingId}>
                    <td>
                      <span className="badge bg-secondary">#{booking.bookingId || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="fw-semibold">{booking.eventName || 'Unknown Event'}</div>
                      <small className="text-muted">Event ID: {booking.eventId || 'N/A'}</small>
                    </td>
                    <td>
                      <div>
                        {booking.eventStartDate ? (
                          <>
                            <div>{new Date(booking.eventStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            <small className="text-muted">
                              {new Date(booking.eventStartDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              {booking.eventEndDate && <> - {new Date(booking.eventEndDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>}
                            </small>
                          </>
                        ) : (
                          <small className="text-muted">Not available</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <i className="bi bi-person-circle me-1"></i>
                        <span className="fw-semibold">{booking.customerName || 'Unknown'}</span>
                      </div>
                      {booking.customerEmail && (
                        <small className="text-muted d-block">
                          <i className="bi bi-envelope me-1"></i>
                          {booking.customerEmail}
                        </small>
                      )}
                      {booking.customerPhone && (
                        <small className="text-muted d-block">
                          <i className="bi bi-telephone me-1"></i>
                          {booking.customerPhone}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-info">{booking.ticketsQuantity || 0} ticket{(booking.ticketsQuantity || 0) > 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {booking.tickets && booking.tickets.length > 0 ? (
                          booking.tickets.map((ticket, index) => (
                            <span key={ticket.ticketId || index} className="badge bg-light text-dark border">
                              {ticket.seatNumber || 'N/A'}
                            </span>
                          ))
                        ) : booking.tickets ? (
                          <span className="text-muted">Empty tickets array</span>
                        ) : (
                          <span className="text-muted">No tickets data</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>Rs. {(booking.totalAmount || 0).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span 
                        className={`badge ${
                          booking.bookingStatus === 'CONFIRMED' 
                            ? 'bg-success' 
                            : booking.bookingStatus === 'COMPLETED'
                            ? 'bg-primary'
                            : booking.bookingStatus === 'PENDING'
                            ? 'bg-warning text-dark'
                            : 'bg-danger'
                        }`}
                      >
                        {booking.bookingStatus || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                        <br />
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : 'N/A'}
                      </small>
                    </td>
                    <td>
                      {booking.bookingStatus === 'CONFIRMED' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleCompleteBooking(booking.bookingId, booking.bookingStatus)}
                          disabled={completingBookingId === booking.bookingId}
                        >
                          {completingBookingId === booking.bookingId ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Completing...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-1"></i>
                              Complete
                            </>
                          )}
                        </button>
                      )}
                      {booking.bookingStatus === 'COMPLETED' && (
                        <span className="text-success small">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Completed
                        </span>
                      )}
                      {booking.bookingStatus === 'PENDING' && (
                        <span className="text-muted small">
                          <i className="bi bi-clock me-1"></i>
                          Pending
                        </span>
                      )}
                      {booking.bookingStatus === 'CANCELLED' && (
                        <span className="text-danger small">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
