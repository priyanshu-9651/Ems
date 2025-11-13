import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import MOCK_EVENTS from './MOCKDATA';
import TicketBookingInterface from './TicketBookingInterface';
import TicketBookingSidebar from './TicketBookingSidebar';
import { getEventDetails } from '../../../services/eventService';

const StepBadge = ({ step, active, completed, onClick }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: completed ? '#e74c3c' : '#ddd',
        color: completed ? '#fff' : '#777',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
      }}
    >
      {step}
    </button>
  </div>
);

export default function TicketBookingPage() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Hooks — always declared at top-level
  const [step, setStep] = useState(1);
  const [selectedVenue, setSelectedVenue] = useState(undefined);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState(undefined);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [eventFromAPI, setEventFromAPI] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // lightweight toast state for validation feedback
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch event details from API
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;
      
      setLoadingEvent(true);
      try {
        const response = await getEventDetails(id);
        if (response.success && response.data) {
          const data = response.data;
          // Map API response to match expected event structure
          // Normalize seatLayout - convert empty string to null
          const seatLayout = data.seatLayout && data.seatLayout !== '' && data.seatLayout !== '""' 
            ? data.seatLayout 
            : null;
          
          // Determine if event requires seats
          const eventRequiresSeat = data.eventRequiresSeat !== false && seatLayout !== null;
          
          const mappedEvent = {
            Id: data.eventId,
            Name: data.eventName,
            Cost: data.eventTicketPrice,
            seatLayout: seatLayout,
            eventRequiresSeat: eventRequiresSeat,
            eventTotalSeats: data.eventTotalSeats,
            eventSeatsAvailable: data.eventSeatsAvailable,
            StartDate: data.eventStartDate,
            eventStartDate: data.eventStartDate,
            eventEndDate: data.eventEndDate,
            Location: data.eventLocation,
            eventLocation: data.eventLocation,
            eventTicketPrice: data.eventTicketPrice,
            eventMode: data.eventMode,
            eventDescr: data.eventDescr,
            // Keep other fields from location.state if available
            ...(location.state?.event || {}),
            // Override with API data
            eventId: data.eventId,
            eventName: data.eventName,
          };
          setEventFromAPI(mappedEvent);
        } else {
          console.error('Failed to fetch event details from API:', response.error);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchEventDetails();
  }, [id, location.state]);

  // Compute event from API, location state, or mock data
  const event = useMemo(() => {
    // Prioritize API data if available
    if (eventFromAPI) {
      return eventFromAPI;
    }
    // Fallback to location state or mock data
    return location.state?.event || MOCK_EVENTS.find((e) => String(e.Id) === String(id));
  }, [eventFromAPI, location.state, id]);

  // derive venues once from event (useMemo so it's stable)
  const venues = useMemo(() => {
    if (!event) return [];
    return event.venues || event.locations || [{ name: event.Location, address: event.Location }];
  }, [event]);

  // auto-select when only one venue (hooks must be top-level, before any early return)
  useEffect(() => {
    if (venues && venues.length === 1) {
      setSelectedVenue((prev) => prev || venues[0]);
    }
  }, [venues]);

  // Redirect to events page if event not found (do this in effect to avoid imperative navigation during render)
  useEffect(() => {
    if (!event) {
      navigate('/EventsPage');
    }
  }, [event, navigate]);

  // Auth check: only allow CUSTOMER role to access booking flow
  useEffect(() => {
    if (!event) return; // wait until event is available
    const role = (localStorage.getItem('role') || '').toUpperCase();
    if (role !== 'CUSTOMER') {
      navigate('/login', { state: { redirectTo: `/book/${id}`, event } });
    }
  }, [event, id, navigate]);

  // Initialize date/time defaults when event becomes available
  useEffect(() => {
    if (event) {
      // Auto-set date and time from event data
      if (event.eventStartDate) {
        const startDate = new Date(event.eventStartDate);
        const formattedDate = startDate.toLocaleDateString();
        const formattedTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        setSelectedDate(formattedDate);
        setSelectedTime(formattedTime);
      } else if (event.StartDate) {
        setSelectedDate(event.StartDate);
        if (event.Time) {
          setSelectedTime(event.Time);
        }
      }
      
      // Auto-select venue
      const venues = event.venues || (event.locations ? event.locations : null);
      if (venues && venues.length === 1) {
        setSelectedVenue((prev) => prev || venues[0]);
      } else if (!venues || venues.length === 0) {
        setSelectedVenue((prev) => prev || { name: event.Location || event.eventLocation, address: event.Location || event.eventLocation });
      }
    }
  }, [event]);

  // Generate date options from event start and end dates
  const dateOptions = useMemo(() => {
    if (!event) return [];
    
    const options = [];
    if (event.eventStartDate) {
      const startDate = new Date(event.eventStartDate);
      options.push(startDate.toLocaleDateString());
      
      // If there's an end date, add a few dates in between
      if (event.eventEndDate) {
        const endDate = new Date(event.eventEndDate);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Add up to 3 additional dates if multi-day event
        if (daysDiff > 0) {
          for (let i = 1; i <= Math.min(daysDiff, 3); i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            options.push(date.toLocaleDateString());
          }
        }
      }
    } else if (event.StartDate) {
      options.push(event.StartDate);
    }
    
    return options.length > 0 ? options : [new Date().toLocaleDateString()];
  }, [event]);

  // Generate time options from event start date
  const timeOptions = useMemo(() => {
    if (!event) return [];
    
    if (event.eventStartDate) {
      const startDate = new Date(event.eventStartDate);
      const mainTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      // Offer the main time and potentially alternative showtimes
      return [mainTime];
    } else if (event.Time) {
      return [event.Time];
    }
    
    return ['07:00 PM']; // Default fallback
  }, [event]);

  // Validate before advancing steps
  const goNext = () => {
    // Step 1: require venue ONLY if there are multiple venues to choose from
    if (step === 1 && venues && venues.length > 1 && !selectedVenue) {
      triggerToast('Please select a venue to continue');
      return;
    }
    // Step 2: Validate date/time is set
    if (step === 2) {
      if (!selectedDate || !selectedTime) {
        triggerToast('Event date/time information is missing');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  if (!event) return null;

  return (
    <div className="min-vh-content" style={{ backgroundColor: '#fff', padding: '2rem 0' }}>
      <div className="container">
        <div className="d-flex align-items-center mb-3">
          <div style={{ width: 40 }} />
          <h4 className="m-0">{event.Name}</h4>
        </div>
        
        <div className="mb-4 d-flex align-items-center" style={{ gap: 12, flexWrap: 'wrap' }}>
          { [
              { id: 1, label: 'Venue' },
              { id: 2, label: 'Date & Time' },
              { id: 3, label: 'Tickets' },
              { id: 4, label: 'Review & Pay' },
            ].map((s, i) => (
            <div key={s.id} className="d-flex align-items-center" style={{ gap: 8 }}>
              {i > 0 && <span className="text-muted">&gt;</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StepBadge
                  step={s.id}
                  active={step === s.id}
                  completed={s.id <= step}
                  onClick={s.id <= step ? () => setStep(s.id) : null}
                />
                <button
                  type="button"
                  onClick={s.id <= step ? () => setStep(s.id) : null}
                  className="btn btn-link p-0"
                  style={{ color: s.id <= step ? '#000' : '#777', textDecoration: 'none' }}
                >
                  <small className="text-muted" style={{ color: s.id <= step ? '#000' : '#777' }}>{s.label}</small>
                </button>
              </div>
            </div>
          )) }
        </div>

        <div className="card p-4 mb-4">
          <div className="mb-3 text-muted">{event.Location || event.eventLocation}</div>
          <div className="fw-semibold mb-2">{event.Name || event.eventName}</div>
          <div className="text-muted small">
            {selectedDate || '—'} {selectedDate && selectedTime ? '•' : ''} {selectedTime || ''}
          </div>
          {event.eventMode && (
            <div className="mt-2">
              <span className="badge bg-info">{event.eventMode}</span>
              {event.eventRequiresSeat === false && (
                <span className="badge bg-secondary ms-2">General Admission</span>
              )}
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="card p-4 mb-4">
            <h5>Select Venue</h5>
            <p className="text-muted">Choose a venue for this event. You can view each venue on maps.</p>
            <div className="d-flex flex-column gap-2 mb-3">
              {venues.map((v, idx) => {
                const name = v.name || v.city || v.address || `Venue ${idx + 1}`;
                const address = v.address || v.city || name;
                const onlyOne = venues.length === 1;
                const isChecked = selectedVenue && (selectedVenue.name || selectedVenue.address) === (name || address);
                return (
                  <label key={idx} className={`p-3 border rounded d-flex justify-content-between align-items-center ${isChecked ? 'bg-light' : ''}`} style={{ cursor: onlyOne ? 'default' : 'pointer' }}>
                    <div>
                      <div className="fw-semibold">{name} {onlyOne && <small className="text-muted ms-2">(Only one location)</small>}</div>
                      <div className="text-muted small">{address}</div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={onlyOne}
                        onChange={() => setSelectedVenue(v)}
                      />
                      <a className="btn btn-sm btn-outline-secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}>View on map</a>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="d-flex justify-content-between">
              {/* On step 1, Back should go to Event Details page. On other steps, goPrev. */}
              <button className="btn btn-light" onClick={() => navigate(`/event/${event.Id}`, { state: { event } })}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card p-4 mb-4">
            <h5>Event Schedule</h5>
            <p className="text-muted">
              {event.eventStartDate 
                ? `Event is scheduled for ${new Date(event.eventStartDate).toLocaleDateString()} at ${new Date(event.eventStartDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                : 'Select your preferred date and time'}
            </p>

            {dateOptions.length > 1 && (
              <>
                <h6 className="mt-3">Available Dates</h6>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {dateOptions.map((d) => (
                    <button 
                      key={d} 
                      className={`btn ${d === selectedDate ? 'btn-success' : 'btn-outline-secondary'}`} 
                      onClick={() => setSelectedDate(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </>
            )}

            {timeOptions.length > 1 && (
              <>
                <h6 className="mt-3">Available Times</h6>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {timeOptions.map((t) => (
                    <button 
                      key={t} 
                      className={`btn ${t === selectedTime ? 'btn-success' : 'btn-outline-secondary'}`} 
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}

            {dateOptions.length === 1 && timeOptions.length === 1 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                This event has a fixed schedule. Date and time have been automatically selected.
                <div className="mt-2">
                  <strong>Selected:</strong> {selectedDate || 'Loading...'} • {selectedTime || 'Loading...'}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between" style={{ position: 'sticky', bottom: 0, background: '#fff', paddingTop: 12, marginTop: 12 }}>
              <button className="btn btn-light" onClick={goPrev}>Back</button>
              <button className="btn btn-primary px-5" onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h5 className="mb-3">Select Tickets</h5>
            <TicketBookingInterface
              event={event}
              selectedVenue={selectedVenue}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onProceed={(booking) => {
                // Accept booking from the ticket interface and jump to review
                setBookingSummary(booking);
                setStep(4);

                // Update local user data (increment upcomingEvents) in localStorage
                try {
                  const qty = booking?.quantity ?? booking?.ticketsCount ?? booking?.numTickets ?? (Array.isArray(booking?.seats) ? booking.seats.length : 1);
                  const raw = localStorage.getItem('user');
                  const user = raw ? JSON.parse(raw) : { name: 'Guest', email: '', upcomingEvents: 0, eventsAttended: 0 };
                  user.upcomingEvents = (user.upcomingEvents || 0) + Number(qty || 1);
                  // Optionally keep a list of upcoming event ids
                  user.upcomingEventIds = Array.isArray(user.upcomingEventIds) ? user.upcomingEventIds : [];
                  if (event && event.Id) user.upcomingEventIds.push(event.Id);
                  localStorage.setItem('user', JSON.stringify(user));
                  // Notify other components in the same window
                  window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));

                  // --- Update available seats for this event ---
                  try {
                    const booked = Number(qty || 1);
                    const currentAvailable = typeof event.availableSeats === 'number' ? event.availableSeats : (event.totalSeats || 0);
                    const newAvailable = Math.max(0, currentAvailable - booked);
                    // mutate event for immediate UI feedback on this page
                    try { event.availableSeats = newAvailable; } catch (e) {}
                    // Removed localStorage storage as it's not needed
                    // const evMapRaw = localStorage.getItem('events');
                    // const evMap = evMapRaw ? JSON.parse(evMapRaw) : {};
                    // evMap[event.Id] = { availableSeats: newAvailable };
                    // localStorage.setItem('events', JSON.stringify(evMap));
                    // notify other components/pages
                    window.dispatchEvent(new CustomEvent('eventsUpdated', { detail: { eventId: event.Id, availableSeats: newAvailable } }));
                  } catch (e) {
                    console.error('Failed to update event seats after booking', e);
                  }
                } catch (err) {
                  console.error('Failed to update user after booking', err);
                }
              }}
            />
          </div>
        )}

        {step === 4 && bookingSummary && (
          <div className="row">
            <div className="col-md-8">
              <div className="card p-4 mb-4">
                <h5>Ticket options</h5>
                <p className="text-muted">M-Ticket (default)</p>
                <div className="mt-3">
                  <h6>Terms</h6>
                  <ul>
                    <li>Tickets available in profile.</li>
                    <li>No physical tickets required.</li>
                  </ul>
                </div>
              </div>
            </div>

            <TicketBookingSidebar event={event} bookingSummary={bookingSummary} selectedVenue={selectedVenue} />
          </div>
        )}

        {showToast && (
          <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1050 }}>
            <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true" style={{ minWidth: 240 }}>
              <div className="toast-body">{toastMsg}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
