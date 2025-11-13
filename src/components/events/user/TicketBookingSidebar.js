import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TicketBookingSidebar({ event, bookingSummary, selectedVenue, onBooked }) {
  const navigate = useNavigate();

  if (!bookingSummary) return null;

  const handleProceed = () => {
    // optional callback for parent
    if (typeof onBooked === 'function') onBooked(bookingSummary);
    alert('Payment simulated — booking complete');
    navigate('/userprofile');
  };

  return (
    <div className="col-md-4">
      <div className="card p-3">
        <div className="fw-semibold">{event.Name}</div>
        <div className="text-muted small mt-2">{bookingSummary.date} • {bookingSummary.time}</div>
        <div className="text-muted small">Venue: {selectedVenue?.name || selectedVenue?.address || bookingSummary.location}</div>
        <div className="mt-3">{bookingSummary.tickets} ticket(s)</div>
        {bookingSummary.seats && bookingSummary.seats.length > 0 && (
          <div className="mt-2 text-muted small">Seats: {bookingSummary.seats.join(', ')}</div>
        )}
        <hr />
        <div className="d-flex justify-content-between">
          <div>Sub-total</div>
          <div>₹{bookingSummary.total}</div>
        </div>
        <div className="d-flex justify-content-between mt-2">
          <div>Booking Fee</div>
          <div>₹{Math.round(bookingSummary.total * 0.095)}</div>
        </div>
        <hr />
        <div className="d-flex justify-content-between fw-bold">
          <div>Total</div>
          <div>₹{bookingSummary.total + Math.round(bookingSummary.total * 0.095)}</div>
        </div>
        <div className="mt-3">
          <button className="btn btn-danger w-100" onClick={handleProceed}>Proceed to Pay</button>
        </div>
      </div>
    </div>
  );
}
