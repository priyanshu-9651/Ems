import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../Icons';
import { 
  logoutUser, 
  getAllEventsAdmin, 
  approveEvent, 
  rejectEvent,
  getAllEventRevenue 
} from '../../services/authService';
import { clearAuthData } from '../../utils/jwt';

export function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewEvent, setViewEvent] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch events and revenue data in parallel
      const [eventsResponse, revenueResponse] = await Promise.all([
        getAllEventsAdmin(),
        getAllEventRevenue()
      ]);
      
      if (eventsResponse.success) {
        const eventsData = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
        setEvents(eventsData);
      } else {
        setError(eventsResponse.error || 'Failed to fetch events');
      }

      if (revenueResponse.success) {
        const revenueDataArray = Array.isArray(revenueResponse.data) ? revenueResponse.data : [];
        console.log('Revenue API Response:', revenueResponse);
        console.log('Revenue Data Array:', revenueDataArray);
        setRevenueData(revenueDataArray);
      } else {
        console.error('Revenue API Error:', revenueResponse.error);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
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
    clearAuthData();
    navigate('/');
  };

  const handleApprove = async (eventId) => {
    if (!window.confirm('Are you sure you want to approve this event?')) return;
    
    try {
      const response = await approveEvent(eventId);
      if (response.success) {
        alert('Event approved successfully!');
        fetchEvents(); // Refresh the list
      } else {
        alert(`Failed to approve event: ${response.error}`);
      }
    } catch (err) {
      console.error('Error approving event:', err);
      alert('Failed to approve event. Please try again.');
    }
  };

  const handleRejectClick = (event) => {
    setRejectingEvent(event);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await rejectEvent(rejectingEvent.eventId, rejectReason);
      if (response.success) {
        alert('Event rejected successfully!');
        setShowRejectModal(false);
        setRejectingEvent(null);
        setRejectReason('');
        fetchEvents(); // Refresh the list
      } else {
        alert(`Failed to reject event: ${response.error}`);
      }
    } catch (err) {
      console.error('Error rejecting event:', err);
      alert('Failed to reject event. Please try again.');
    }
  };

  const filteredEvents = () => {
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
  };

  const handleView = (ev) => {
    setViewEvent(ev);
  };

  // Helper function to get revenue for a specific event
  const getEventRevenue = (eventId) => {
    const revenue = revenueData.find(r => r.eventId === eventId);
    console.log(`Getting revenue for event ${eventId}:`, revenue);
    return revenue?.totalRevenue || 0;
  };

  // Calculate total revenue for all filtered events
  const getTotalRevenue = () => {
    const total = filteredEvents().reduce((sum, ev) => {
      return sum + getEventRevenue(ev.eventId);
    }, 0);
    console.log('Total Revenue Calculated:', total);
    return total;
  };

  const categories = Array.from(new Set(events.map((e) => e.eventCategory))).filter(Boolean);

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
          <button className="btn btn-primary" onClick={() => navigate('/admin/create-event')}>
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

      {/* Revenue Stats Card */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Events</h6>
              <h3 className="mb-0">{filteredEvents().length}</h3>
              <small className="text-muted">Displayed events</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Seats</h6>
              <h3 className="mb-0">
                {filteredEvents().reduce((sum, ev) => sum + (ev.eventTotalSeats || 0), 0).toLocaleString()}
              </h3>
              <small className="text-muted">Across all events</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Total Revenue</h6>
              <h3 className="mb-0">Rs. {getTotalRevenue().toLocaleString()}</h3>
              <small>From {filteredEvents().length} event{filteredEvents().length !== 1 ? 's' : ''}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <input
                className="form-control"
                placeholder="Search by event name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <div className="col-6 col-md-4">
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

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Event ID</th>
                  <th scope="col">Event Name</th>
                  <th scope="col">Date & Time</th>
                  <th scope="col">Location</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Revenue</th>
                  <th scope="col">Organizer</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents().map((ev) => (
                  <tr key={ev.eventId}>
                    <td>
                      <span className="badge bg-secondary">#{ev.eventId}</span>
                    </td>
                    <td>
                      <div className="fw-semibold">{ev.eventName || 'Untitled Event'}</div>
                      <small className="text-muted">
                        {ev.eventSeatsAvailable || 0} / {ev.eventTotalSeats || 0} seats available
                      </small>
                    </td>
                    <td>
                      <div>{ev.eventStartDate ? new Date(ev.eventStartDate).toLocaleDateString() : 'N/A'}</div>
                      <small className="text-muted">
                        {ev.eventStartTime || 'N/A'}
                      </small>
                    </td>
                    <td>{ev.eventLocation || 'N/A'}</td>
                    <td>
                      <span className="badge bg-info">{ev.eventCategory || 'Uncategorized'}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          ev.eventStatus === 'UPCOMING'
                            ? 'bg-success'
                            : ev.eventStatus === 'ONGOING'
                            ? 'bg-primary'
                            : ev.eventStatus === 'COMPLETED'
                            ? 'bg-secondary'
                            : ev.eventStatus === 'CANCELLED'
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        {ev.eventStatus || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <strong className="text-success">
                        Rs. {getEventRevenue(ev.eventId).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <small className="text-muted">
                        <i className="bi bi-person-badge me-1"></i>
                        {ev.organizer?.user?.fullName || 'Unknown'}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleView(ev)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleApprove(ev.eventId)}
                          title="Approve Event"
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRejectClick(ev)}
                          title="Reject Event"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEvents().length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                    <div className="col-md-6">
                      <p><strong>Event ID:</strong> {viewEvent.eventId}</p>
                      <p><strong>Category:</strong> {viewEvent.eventCategory || 'N/A'}</p>
                      <p><strong>Location:</strong> {viewEvent.eventLocation || 'N/A'}</p>
                      <p><strong>Status:</strong> <span className={`badge bg-${
                        viewEvent.eventStatus === 'UPCOMING' ? 'success' : 
                        viewEvent.eventStatus === 'ONGOING' ? 'primary' : 
                        viewEvent.eventStatus === 'COMPLETED' ? 'secondary' : 'warning'
                      }`}>{viewEvent.eventStatus}</span></p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Start Date:</strong> {viewEvent.eventStartDate ? new Date(viewEvent.eventStartDate).toLocaleString() : 'N/A'}</p>
                      <p><strong>End Date:</strong> {viewEvent.eventEndDate ? new Date(viewEvent.eventEndDate).toLocaleString() : 'N/A'}</p>
                      <p><strong>Total Seats:</strong> {viewEvent.eventTotalSeats || 0}</p>
                      <p><strong>Available Seats:</strong> {viewEvent.eventSeatsAvailable || 0}</p>
                    </div>
                  </div>
                  <hr />
                  <div>
                    <p><strong>Description:</strong></p>
                    <p>{viewEvent.eventDescription || 'No description available.'}</p>
                  </div>
                  <hr />
                  <div>
                    <p><strong>Organizer:</strong> {viewEvent.organizer?.user?.fullName || 'Unknown'}</p>
                    <p><strong>Organizer Email:</strong> {viewEvent.organizer?.user?.email || 'N/A'}</p>
                  </div>
                  <hr />
                  <div>
                    <p><strong>Revenue:</strong> <span className="text-success fw-bold">Rs. {getEventRevenue(viewEvent.eventId).toLocaleString()}</span></p>
                    <p><strong>Ticket Price:</strong> Rs. {
                      revenueData.find(r => r.eventId === viewEvent.eventId)?.eventTicketPrice || 0
                    }</p>
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

      {/* Reject Event Modal */}
      {showRejectModal && rejectingEvent && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reject Event: {rejectingEvent.eventName}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectingEvent(null);
                      setRejectReason('');
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Reason for Rejection *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Please provide a reason for rejecting this event..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectingEvent(null);
                      setRejectReason('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleRejectSubmit}
                  >
                    Reject Event
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
