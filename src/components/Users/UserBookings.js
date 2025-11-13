import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CreditCard } from 'lucide-react';
import { getCustomerBookings, getEventById } from '../../services/eventService';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const customerProfile = JSON.parse(localStorage.getItem('customerProfile') || '{}');
        const customerId = customerProfile.customerId;

        if (!customerId) {
          setError('Customer information not found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await getCustomerBookings(customerId);
        
        if (response.success) {
          setBookings(response.data);

          // Fetch event details for each unique event
          const uniqueEventIds = [...new Set(response.data.map(booking => booking.eventId))];
          
          // Use getEventById which returns complete event data
          const eventPromises = uniqueEventIds.map(eventId => getEventById(eventId));
          const eventResponses = await Promise.all(eventPromises);

          const eventsMap = {};
          eventResponses.forEach((resp, index) => {
            const eventId = uniqueEventIds[index];
            
            if (resp.success && resp.data) {
              eventsMap[eventId] = resp.data;
            }
          });
          
          setEvents(eventsMap);
        } else {
          setError(response.error || 'Failed to load bookings');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSeats = (tickets) => {
    if (!tickets || !Array.isArray(tickets)) return 'N/A';
    return tickets.map(ticket => ticket.seatNumber).join(', ');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-5">
        <Calendar size={48} className="text-muted mb-3" />
        <h4 className="text-muted">No Bookings Found</h4>
        <p className="text-muted">You haven't made any bookings yet.</p>
      </div>
    );
  }

  // Separate bookings into upcoming and past based on event start date
  const currentDate = new Date();
  const upcomingBookings = bookings.filter(booking => {
    const event = events[booking.eventId];
    if (!event?.eventStartDate) return true; // If no date, show in upcoming
    const eventDate = new Date(event.eventStartDate);
    return eventDate >= currentDate;
  });
  const pastBookings = bookings.filter(booking => {
    const event = events[booking.eventId];
    if (!event?.eventStartDate) return false;
    const eventDate = new Date(event.eventStartDate);
    return eventDate < currentDate;
  });

  const renderBooking = (booking) => {
    const event = events[booking.eventId];
    return (
            <div key={booking.bookingId} className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h5 className="card-title mb-2">
                        {booking.eventName || `Event ${booking.eventId}`}
                      </h5>
                      <div className="mb-2">
                        <MapPin size={16} className="me-2 text-muted" />
                        <small className="text-muted">
                          {event?.eventLocation || 'Venue not available'}
                        </small>
                      </div>
                      <div className="mb-2">
                        <Calendar size={16} className="me-2 text-muted" />
                        <small className="text-muted">
                          <strong>Event Date:</strong> {event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not available'}
                          {event?.eventEndDate && new Date(event.eventStartDate).toDateString() !== new Date(event.eventEndDate).toDateString() && (
                            <> to {new Date(event.eventEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</>
                          )}
                          <br />
                          <strong>Time:</strong> {event?.eventStartDate ? new Date(event.eventStartDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Time not available'}
                          {event?.eventEndDate && <> - {new Date(event.eventEndDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>}
                        </small>
                      </div>
                      <div className="mb-2">
                        <Users size={16} className="me-2 text-muted" />
                        <small className="text-muted">
                          {booking.ticketsQuantity} Ticket{booking.ticketsQuantity > 1 ? 's' : ''} - Seats: {formatSeats(booking.tickets)}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="mb-2">
                        <CreditCard size={16} className="me-2 text-muted" />
                        <span className="fw-bold">₹{booking.totalAmount || 'N/A'}</span>
                      </div>
                      <div>
                        <small className="text-muted">
                          Booked on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </small>
                      </div>
                      <div className="mt-2">
                        {booking.bookingStatus === 'COMPLETED' && (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            COMPLETED
                          </span>
                        )}
                        {booking.bookingStatus === 'CONFIRMED' && (
                          <span className="badge" style={{ backgroundColor: '#90EE90', color: '#155724' }}>
                            <i className="bi bi-check-circle me-1"></i>
                            CONFIRMED
                          </span>
                        )}
                        {booking.bookingStatus === 'PENDING' && (
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-clock me-1"></i>
                            PENDING
                          </span>
                        )}
                        {booking.bookingStatus === 'CANCELLED' && (
                          <span className="badge bg-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            CANCELLED
                          </span>
                        )}
                        {!booking.bookingStatus && (
                          <span className="badge bg-secondary">UNKNOWN</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {booking.tickets && booking.tickets.length > 0 && (
                    <div className="mt-3 pt-3 border-top">
                      <h6>Ticket Details</h6>
                      <div className="row g-2">
                        {booking.tickets.map((ticket) => (
                          <div key={ticket.ticketId} className="col-auto">
                            <div className="badge bg-light text-dark p-2">
                              Ticket #{ticket.ticketId} - Seat {ticket.seatNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">My Bookings</h2>
      
      {/* Upcoming Events */}
      {upcomingBookings.length > 0 && (
        <>
          <h4 className="mb-3 text-primary">
            <Calendar size={20} className="me-2" />
            Upcoming Events ({upcomingBookings.length})
          </h4>
          <div className="row g-4 mb-5">
            {upcomingBookings.map((booking) => (
              <div key={booking.bookingId} className="col-12">
                {renderBooking(booking)}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Past Events */}
      {pastBookings.length > 0 && (
        <>
          <h4 className="mb-3 text-muted">
            <Calendar size={20} className="me-2" />
            Past Events ({pastBookings.length})
          </h4>
          <div className="row g-4">
            {pastBookings.map((booking) => (
              <div key={booking.bookingId} className="col-12">
                {renderBooking(booking)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserBookings;
