import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SeatMap from './SeatMap';
import { getBookedSeats, createBooking } from '../../../services/eventService';

export default function TicketBookingInterface({ event, selectedDate, selectedTime, onProceed }) {
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookedTicketsCount, setBookedTicketsCount] = useState(0);

  // Check if event requires seat selection
  // Event doesn't require seats if:
  // 1. eventRequiresSeat is explicitly false, OR
  // 2. seatLayout is empty/null/invalid
  const requiresSeat = useMemo(() => {
    if (event?.eventRequiresSeat === false) return false;
    if (!event?.seatLayout || event.seatLayout === '' || event.seatLayout === '""') return false;
    try {
      const parsed = JSON.parse(event.seatLayout);
      return parsed && (parsed.rows?.length > 0 || parsed.columns > 0);
    } catch (e) {
      return false;
    }
  }, [event?.eventRequiresSeat, event?.seatLayout]);

  // Parse seat layout only if seats are required and layout exists
  const layout = useMemo(() => {
    if (!requiresSeat || !event?.seatLayout || event.seatLayout === '' || event.seatLayout === '""') {
      return { rows: ['A','B','C','D','E','F'], columns: 10 };
    }
    try {
      return JSON.parse(event.seatLayout);
    } catch (e) {
      console.error('Failed to parse seat layout:', e);
      return { rows: ['A','B','C','D','E','F'], columns: 10 };
    }
  }, [requiresSeat, event?.seatLayout]);
  
  // Calculate max tickets available
  // For seated events: total seats in layout minus already booked seats
  // For non-seated events: eventTotalSeats minus booked tickets count
  const maxTickets = useMemo(() => {
    if (requiresSeat) {
      return Math.max(0, (layout.rows.length * layout.columns) - bookedSeats.length);
    } else {
      // For non-seated events: calculate available = total - booked
      const totalSeats = event?.eventSeatsAvailable ?? event?.eventTotalSeats ?? 0;
      const available = totalSeats - bookedTicketsCount;
      return Math.max(0, available);
    }
  }, [requiresSeat, layout, bookedSeats.length, event?.eventSeatsAvailable, event?.eventTotalSeats, bookedTicketsCount]);

  useEffect(() => {
    // reset when event changes
    setSelectedSeats([]);
    setTicketQuantity(1);
  }, [event?.Id, event?.eventId]);

  useEffect(() => {
    // Fetch booked seats/tickets for the event
    const eventId = event?.Id || event?.eventId;
    if (eventId) {
      getBookedSeats(eventId).then(response => {
        if (response.success) {
          if (requiresSeat) {
            // For seated events: store the booked seat codes
            setBookedSeats(response.data);
          } else {
            // For non-seated events: count the number of booked tickets
            setBookedTicketsCount(response.data.length);
          }
        }
      });
    }
  }, [event?.Id, event?.eventId, requiresSeat]);

  const onSeatChange = (newSeats) => {
    // prevent selecting more seats than available
    if (newSeats.length > maxTickets) return;
    setSelectedSeats(newSeats);
  };

  const seatTotal = requiresSeat
    ? (selectedSeats || []).reduce((s, seat) => s + (seat.price || event?.Cost || event?.eventTicketPrice || 0), 0)
    : ticketQuantity * (event?.Cost || event?.eventTicketPrice || 0);

  const handleProceed = async () => {
    // Validate based on event type
    if (requiresSeat && selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    if (!requiresSeat && ticketQuantity < 1) {
      alert('Please select at least one ticket');
      return;
    }

    const customerProfile = JSON.parse(localStorage.getItem('customerProfile') || '{}');
    const customerId = customerProfile.customerId;
    if (!customerId) {
      alert('Customer information not found. Please log in again.');
      navigate('/login');
      return;
    }

    setLoading(true);

    const eventId = event.Id || event.eventId;
    
    // Build booking data according to API specification (BookingRequestDto)
    // API expects: { eventId, customerId, selectedSeats?, ticketsQuantity? }
    const bookingData = {
      eventId: parseInt(eventId),
      customerId: parseInt(customerId),
    };
    
    if (requiresSeat) {
      // For seated events: include selectedSeats array
      bookingData.selectedSeats = selectedSeats.map(s => s.code);
      bookingData.ticketsQuantity = null; // Can be null for seated events
    } else {
      // For non-seated (general admission) events: include ticketsQuantity
      bookingData.selectedSeats = null; // Can be null for non-seated events
      bookingData.ticketsQuantity = ticketQuantity;
    }

    const response = await createBooking(bookingData);
    if (response.success) {
      const booking = {
        eventId: eventId,
        name: event.Name || event.eventName,
        tickets: requiresSeat ? selectedSeats.length : ticketQuantity,
        total: seatTotal,
        date: selectedDate || event.StartDate || event.eventStartDate,
        time: selectedTime || event.Time || event.eventStartTime,
        location: event.Location || event.eventLocation,
        seats: requiresSeat ? selectedSeats.map(s => s.code) : null,
        bookingId: response.data.bookingId,
      };

      if (typeof onProceed === 'function') {
        onProceed(booking);
        return;
      }

      alert(`Booking confirmed! Booking ID: ${response.data.bookingId}`);
      navigate('/userprofile');
    } else {
      if (response.status === 409) {
        alert(`Seat conflict: ${response.error}`);
        // Refresh booked seats if applicable
        if (requiresSeat) {
          getBookedSeats(eventId).then(res => {
            if (res.success) setBookedSeats(res.data);
          });
        }
      } else {
        alert(`Booking failed: ${response.error || 'Unknown error'}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="card p-3" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="d-flex gap-3 align-items-start mb-3">
        <div style={{ width: 140, height: 100, backgroundImage: `url(${event.Photo})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 6 }} />
        <div>
          <h5 className="mb-1">{event.Name || event.eventName}</h5>
          <div className="text-muted small">
            {selectedDate || event.StartDate || (event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : 'N/A')} 
            {' • '}
            {selectedTime || event.Time || (event.eventStartDate ? new Date(event.eventStartDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}
          </div>
          <div className="text-muted small">{event.Location || event.eventLocation}</div>
        </div>
      </div>

      <hr />

      <div className="mb-3">
        <strong>Price per ticket:</strong> {(event.Cost || event.eventTicketPrice) > 0 ? `₹${event.Cost || event.eventTicketPrice}` : 'Free'}
      </div>

      {/* Conditional rendering based on requiresSeat */}
      {requiresSeat ? (
        <>
          {/* Seat map selection (for seated events) */}
          <div className="mb-3">
            <strong style={{ display: 'block', marginBottom: 8 }}>Select seats</strong>
            {maxTickets > 0 ? (
              <>
                <SeatMap
                  layout={layout}
                  basePrice={event.Cost || event.eventTicketPrice}
                  blocked={bookedSeats}
                  value={selectedSeats}
                  onChange={onSeatChange}
                />
                <div className="mt-2 text-muted">Available seats: {maxTickets}</div>
              </>
            ) : (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Sorry, all seats are booked for this event.
              </div>
            )}
          </div>

          <div className="mb-3">
            <strong>Selected seats:</strong> {selectedSeats.length > 0 ? selectedSeats.map(s => s.code).join(', ') : 'None'}
          </div>
        </>
      ) : (
        <>
          {/* Quantity selection (for non-seated events) */}
          <div className="mb-3">
            <strong style={{ display: 'block', marginBottom: 8 }}>Select number of tickets</strong>
            {maxTickets > 0 ? (
              <>
                <div className="d-flex align-items-center gap-3">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                    disabled={ticketQuantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    className="form-control text-center" 
                    style={{ width: '80px' }}
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Math.max(1, Math.min(maxTickets, parseInt(e.target.value) || 1)))}
                    min="1"
                    max={maxTickets}
                  />
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setTicketQuantity(Math.min(maxTickets, ticketQuantity + 1))}
                    disabled={ticketQuantity >= maxTickets}
                  >
                    +
                  </button>
                  <span className="text-muted">Max: {maxTickets} available</span>
                </div>
                <div className="mt-2 text-muted small">
                  Total capacity: {event?.eventTotalSeats || 'N/A'} seats
                </div>
              </>
            ) : (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Sorry, all tickets are sold out for this event.
              </div>
            )}
          </div>

          {maxTickets > 0 && (
            <div className="mb-3">
              <strong>Number of tickets:</strong> {ticketQuantity}
            </div>
          )}
        </>
      )}

      <div className="mb-3">
        <strong>Total:</strong> <span className="ms-2">{(event.Cost || event.eventTicketPrice) > 0 ? `₹${seatTotal}` : 'Free'}</span>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-secondary me-2" onClick={() => navigate(-1)}>Cancel</button>
        <button 
          className="btn btn-primary" 
          onClick={handleProceed} 
          disabled={
            loading || 
            maxTickets === 0 ||
            (requiresSeat ? selectedSeats.length === 0 : ticketQuantity < 1)
          }
        >
          {loading ? 'Processing...' : maxTickets === 0 ? 'Sold Out' : 'Proceed'}
        </button>
      </div>
    </div>
  );
}
