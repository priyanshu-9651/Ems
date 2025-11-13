import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../Icons';
import { logoutUser } from '../../services/authService';
import { getEventsForOrganizer, deleteEvent } from '../../services/eventService';

export function EventOrganizerEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewEvent, setViewEvent] = useState(null);
  const fileInputRef = useRef(null);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // Clear stored role and user
    try {
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('organizerProfile');
      localStorage.removeItem('organizerId');
    } catch (e) {
      // ignore
    }
    // Navigate to home page
    navigate('/');
  };

  useEffect(() => {
    document.body.style.paddingRight = '';
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEventsForOrganizer();
      if (data.success) {
        setEvents(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function filteredEvents() {
    return events.filter((ev) => {
      const term = search.trim().toLowerCase();
      if (term) {
        const inName = ev.name.toLowerCase().includes(term);
        const inLoc = ev.location.toLowerCase().includes(term);
        if (!inName && !inLoc) return false;
      }
      if (statusFilter && ev.status !== statusFilter) return false;
      if (categoryFilter && ev.category !== categoryFilter) return false;
      return true;
    });
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  }

  function handleView(ev) {
    setViewEvent(ev);
  }

  const categories = Array.from(new Set(events.map((e) => e.category))).filter(Boolean);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchEvents}>Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h3 mb-1">Events Management</h1>
          <p className="text-muted mb-0">Manage your events, track registrations, and monitor performance.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-primary" onClick={() => navigate('/organizer/create-event')}>
            + Create New Event
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/settings')}
            title="Profile Settings"
          >
            <UserIcon />
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="dashboard-card mb-4">
        <div className="p-3">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option>Published</option>
                <option>Draft</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light" p-2>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Date & Time</th>
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">Price</th>
              <th scope="col">Capacity</th>
              <th scope="col" style={{ width: 150 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents().map((ev) => (
              <tr key={ev.eventId}>
                <td>
                  <div className="d-flex align-items-center">
                    <div
                      style={{
                        width: 56,
                        height: 40,
                        background: '#e9ecef',
                        marginRight: 12,
                        borderRadius: 6,
                      }}
                    ></div>
                    <div>
                      <div className="fw-semibold">{ev.eventName}</div>
                      <div className="text-muted small">{ev.eventCategory}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div>{new Date(ev.eventStartDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</div>
                    <small className="text-muted">
                      {new Date(ev.eventStartDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {ev.eventEndDate && (
                        <> - {new Date(ev.eventEndDate).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</>
                      )}
                    </small>
                  </div>
                </td>
                <td>{ev.eventLocation}</td>
                <td>
                  <span
                    className={`badge ${
                      ev.eventStatus === 'UPCOMING'
                        ? 'bg-success'
                        : ev.eventStatus === 'DRAFT'
                        ? 'bg-secondary'
                        : 'bg-warning text-dark'
                    }`}
                  >
                    {ev.eventStatus}
                  </span>
                </td>
                <td>Rs. {(ev.eventTicketPrice || 0).toFixed(2)}</td>
                <td>{ev.eventTotalSeats || 'N/A'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleView(ev)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/organizer/create-event', { state: { editMode: true, eventData: ev } })}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(ev.eventId)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEvents().length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewEvent && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{viewEvent.eventName}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setViewEvent(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    <strong>Start Date & Time: </strong>
                    {new Date(viewEvent.eventStartDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {new Date(viewEvent.eventStartDate).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  {viewEvent.eventEndDate && (
                    <p>
                      <strong>End Date & Time: </strong>
                      {new Date(viewEvent.eventEndDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} at {new Date(viewEvent.eventEndDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  )}
                  <p>
                    <strong>Location: </strong>
                    {viewEvent.eventLocation}
                  </p>
                  <p>
                    <strong>Category: </strong>
                    {viewEvent.eventCategory}
                  </p>
                  <p>
                    <strong>Status: </strong>
                    {viewEvent.eventStatus}
                  </p>
                  <p>
                    <strong>Description: </strong>
                    {viewEvent.eventDescr || 'No description'}
                  </p>
                  <p>
                    <strong>Price: </strong>Rs. {(viewEvent.eventTicketPrice || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Capacity: </strong>
                    {viewEvent.eventTotalSeats || 'N/A'}
                  </p>
                  <p>
                    <strong>Type: </strong>
                    {viewEvent.eventType}
                  </p>
                  <p>
                    <strong>Mode: </strong>
                    {viewEvent.eventMode}
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setViewEvent(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}
