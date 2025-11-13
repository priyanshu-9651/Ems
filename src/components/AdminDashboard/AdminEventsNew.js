import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEventsForAdmin, deleteEvent } from '../../services/eventService';
import { clearAuthData } from '../../utils/jwt';

export function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewEvent, setViewEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getAllEventsForAdmin();
      if (response.success) {
        const eventsData = Array.isArray(response.data) ? response.data : [];
        setEvents(eventsData);
        setError(null);
      } else {
        setError(response.error);
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
        const inName = (ev.eventName || '').toLowerCase().includes(term);
        const inLoc = (ev.eventLocation || '').toLowerCase().includes(term);
        if (!inName && !inLoc) return false;
      }
      if (statusFilter && ev.eventStatus !== statusFilter) return false;
      if (categoryFilter && ev.eventCategory !== categoryFilter) return false;
      return true;
    });
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      const response = await deleteEvent(id);
      if (response.success) {
        setEvents((prev) => prev.filter((ev) => ev.eventId !== id));
      } else {
        alert(response.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  }

  function handleView(ev) {
    setViewEvent(ev);
  }

  const categories = Array.from(new Set(events.map((e) => e.eventCategory))).filter(Boolean);
  const statuses = Array.from(new Set(events.map((e) => e.eventStatus))).filter(Boolean);

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
          <p className="text-muted mb-0">View and manage all events across the platform.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-outline-primary"
            onClick={() => navigate('/admin/dashboard')}
          >
            <i className="bi bi-house"></i> Dashboard
          </button>
          <button 
            className="btn btn-outline-info"
            onClick={() => navigate('/admin/revenue')}
          >
            <i className="bi bi-cash-stack"></i> Revenue
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/settings')}
            title="Profile Settings"
          >
            <i className="bi bi-person"></i>
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={() => {
              clearAuthData();
              window.location.href = '/';
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Events</h6>
              <h3 className="mb-0">{events.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Filtered Results</h6>
              <h3 className="mb-0">{filteredEvents().length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Categories</h6>
              <h3 className="mb-0">{categories.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="p-3">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="Search events by name or location..."
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
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
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
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Organizer</th>
              <th scope="col">Date & Time</th>
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">Price</th>
              <th scope="col">Capacity</th>
              <th scope="col" style={{ width: 120 }}>
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
                  <small className="text-muted">ID: {ev.organizerId || 'N/A'}</small>
                </td>
                <td>
                  <div>
                    <div className="small">{new Date(ev.eventStartDate).toLocaleDateString('en-US', { 
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
                <td>{ev.eventLocation || 'N/A'}</td>
                <td>
                  <span
                    className={`badge ${
                      ev.eventStatus === 'UPCOMING'
                        ? 'bg-success'
                        : ev.eventStatus === 'DRAFT'
                        ? 'bg-secondary'
                        : ev.eventStatus === 'CANCELLED'
                        ? 'bg-danger'
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
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(ev.eventId)}
                      title="Delete Event"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEvents().length === 0 && (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Event Modal */}
      {viewEvent && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
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
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <strong>Start Date & Time:</strong>
                      <p className="mb-0">
                        {new Date(viewEvent.eventStartDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {new Date(viewEvent.eventStartDate).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {viewEvent.eventEndDate && (
                      <div className="col-md-6 mb-3">
                        <strong>End Date & Time:</strong>
                        <p className="mb-0">
                          {new Date(viewEvent.eventEndDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} at {new Date(viewEvent.eventEndDate).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    )}
                    <div className="col-md-6 mb-3">
                      <strong>Location:</strong>
                      <p className="mb-0">{viewEvent.eventLocation || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Category:</strong>
                      <p className="mb-0">{viewEvent.eventCategory}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Status:</strong>
                      <p className="mb-0">
                        <span className={`badge ${
                          viewEvent.eventStatus === 'UPCOMING' ? 'bg-success' :
                          viewEvent.eventStatus === 'DRAFT' ? 'bg-secondary' : 'bg-warning text-dark'
                        }`}>
                          {viewEvent.eventStatus}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Price:</strong>
                      <p className="mb-0">Rs. {(viewEvent.eventTicketPrice || 0).toFixed(2)}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Capacity:</strong>
                      <p className="mb-0">{viewEvent.eventTotalSeats || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Type:</strong>
                      <p className="mb-0">{viewEvent.eventType || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Mode:</strong>
                      <p className="mb-0">{viewEvent.eventMode || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Organizer ID:</strong>
                      <p className="mb-0">{viewEvent.organizerId || 'N/A'}</p>
                    </div>
                    <div className="col-12 mb-3">
                      <strong>Description:</strong>
                      <p className="mb-0">{viewEvent.eventDescr || 'No description available'}</p>
                    </div>
                  </div>
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
