import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../events/admin/EventForm';
import './OrganizerEvent.css';

// Action Icons (using simplified inline SVGs)
const BiEye = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" {...props}><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>;
const BiPencil = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" {...props}><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.105l-5.5 2a.5.5 0 0 1-.5-.5l2-5.5a.5.5 0 0 1 .105-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.542 4.293 4.293-1.542.106-.106A.5.5 0 0 1 5.5 14h.5v-.5a.5.5 0 0 1 .5-.5v-.5h.5a.5.5 0 0 1 .5-.5z"/></svg>;
const BiTrash = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" {...props}><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;

// Confirmation Modal Component
const ConfirmationModal = ({ eventName, onConfirm, onCancel }) => (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} tabIndex="-1">
        <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom-0">
                    <h5 className="modal-title">Confirm Deletion</h5>
                    <button type="button" className="btn-close" onClick={onCancel}></button>
                </div>
                <div className="modal-body py-0">
                    <p className="small text-muted">
                        Are you sure youS want to delete the event: <strong className="text-danger">{eventName}</strong>?
                        This action cannot be undone.
                    </p>
                </div>
                <div className="modal-footer flex-column border-top-0">
                    <button type="button" className="btn btn-danger w-100" onClick={onConfirm}>
                        Delete Event
                    </button>
                    <button type="button" className="btn btn-light w-100" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export function EventOrganizerEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const demoEvents = [
      { id: 1, name: 'Tech Summit', date: '2025-09-20', time: '10:00', location: 'Conference Hall A', status: 'Published', category: 'Conference', registrations: 120, revenue: 5000, image: 'https://placehold.co/56x40/4F46E5/FFFFFF?text=TECH' },
      { id: 2, name: 'Summer Music Festival', date: '2025-08-15', time: '18:00', location: 'Open Grounds', status: 'Published', category: 'Festival', registrations: 450, revenue: 15000, image: 'https://placehold.co/56x40/EC4899/FFFFFF?text=FEST' },
      { id: 3, name: 'Startup Meetup', date: '2025-09-22', time: '17:00', location: 'Meeting Room 2', status: 'Draft', category: 'Meetup', registrations: 25, revenue: 0, image: 'https://placehold.co/56x40/FBBF24/000000?text=START' }
    ];
    setEvents(demoEvents);
  }, []);

  function filteredEvents() {
    return events.filter((ev) => {
      const term = search.trim().toLowerCase();
      if (term) {
        const inName = ev.name.toLowerCase().includes(term);
        const inLoc = ev.location.toLowerCase().includes(term);
        if (!inName && !inLoc) return false;
      }
      if (categoryFilter && ev.category !== categoryFilter) return false;
      return true;
    });
  }

  const handleEventSave = async (eventData, banner, photos) => {
    // ... existing handleEventSave code ...
  };

  const initiateDelete = (id, name) => {
    setEventToDelete({ id, name });
    setShowConfirm(true);
  };

  const executeDelete = () => {
    if (eventToDelete) {
      setEvents((prev) => prev.filter((ev) => ev.id !== eventToDelete.id));
    }
    setShowConfirm(false);
    setEventToDelete(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-success';
      case 'Draft':
        return 'bg-secondary';
      case 'Pending':
        return 'bg-warning text-dark';
      default:
        return 'bg-info';
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h3 mb-1">My Events</h1>
          <p className="text-muted mb-0">Create and manage your events</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreate(true);
            setShowEdit(false);
            setEditingEvent(null);
          }}
        >
          Create New Event
        </button>
      </div>

      <div className="row">
        <div className={showCreate || showEdit ? "col-lg-7" : "col-12"}>
          {/* Search and Filter */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {Array.from(new Set(events.map(e => e.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h4 className="mb-0 text-dark">Event List</h4>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-uppercase small" style={{ width: '80px' }}>Image</th>
                      <th scope="col" className="text-uppercase small">Name & Category</th>
                      <th scope="col" className="text-uppercase small">Date & Time</th>
                      <th scope="col" className="text-uppercase small d-none d-md-table-cell">Location</th>
                      <th scope="col" className="text-uppercase small d-none d-sm-table-cell">Status</th>
                      <th scope="col" className="text-uppercase small d-none d-lg-table-cell">Regs</th>
                      <th scope="col" className="text-uppercase small d-none d-lg-table-cell">Revenue</th>
                      <th scope="col" className="text-center text-uppercase small" style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents().map((ev) => (
                      <tr key={ev.id}>
                        <td>
                          {ev.image ? (
                            <img
                              src={ev.image}
                              alt={ev.name}
                              style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }}
                              className="shadow-sm"
                            />
                          ) : (
                            <div 
                              style={{ width: 56, height: 40, background: '#e9ecef', borderRadius: 6 }}
                              className="d-flex align-items-center justify-content-center text-secondary small"
                            >
                              No Pic
                            </div>
                          )}
                        </td>
                        <td>
                          <div>
                            <div className="fw-semibold text-truncate" style={{maxWidth: '200px'}}>{ev.name}</div>
                            <div className="text-muted small">{ev.category}</div>
                          </div>
                        </td>
                        <td className="text-muted small">
                          {new Date(ev.date).toLocaleDateString()} • {ev.time}
                        </td>
                        <td className="text-muted small d-none d-md-table-cell">{ev.location}</td>
                        <td className="d-none d-sm-table-cell">
                          <span
                            className={`badge rounded-pill ${getStatusBadgeClass(ev.status)}`}
                            style={{ minWidth: '70px', padding: '0.4em 0.8em' }}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="d-none d-lg-table-cell">{ev.registrations}</td>
                        <td className="d-none d-lg-table-cell fw-semibold">${ev.revenue.toLocaleString()}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary rounded-circle"
                              onClick={() => setViewEvent(ev)}
                              title="View Details"
                              style={{ width: '30px', height: '30px', padding: '5px' }}
                            >
                              <BiEye />
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary rounded-circle"
                              onClick={() => {
                                setEditingEvent(ev);
                                setShowEdit(true);
                                setShowCreate(false);
                              }}
                              title="Edit Event"
                              style={{ width: '30px', height: '30px', padding: '5px' }}
                            >
                              <BiPencil />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-circle"
                              onClick={() => initiateDelete(ev.id, ev.name)}
                              title="Delete Event"
                              style={{ width: '30px', height: '30px', padding: '5px' }}
                            >
                              <BiTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEvents().length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-5">
                          No events found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Event Form Column */}
        {(showCreate || showEdit) && (
          <div className="col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">
                    {showEdit ? 'Edit Event' : 'Create New Event'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowCreate(false);
                      setShowEdit(false);
                      setEditingEvent(null);
                    }}
                  />
                </div>
                <EventForm 
                  existingEvent={editingEvent}
                  onSave={handleEventSave}
                  onCancel={() => {
                    setShowCreate(false);
                    setShowEdit(false);
                    setEditingEvent(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Event Modal */}
      {viewEvent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header">
                <h5 className="modal-title">{viewEvent.name} Details</h5>
                <button type="button" className="btn-close" onClick={() => setViewEvent(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    {viewEvent.image && (
                      <img
                        src={viewEvent.image}
                        alt="Event visual"
                        className="img-fluid rounded-3 mb-3"
                        style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div className="col-md-6">
                    <strong>Date & Time:</strong><br />
                    <span className="text-muted">
                      {new Date(viewEvent.date).toLocaleDateString()} • {viewEvent.time}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>Location:</strong><br />
                    <span className="text-muted">{viewEvent.location}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>Category:</strong><br />
                    <span className="text-muted">{viewEvent.category}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong><br />
                    <span className={`badge rounded-pill ${getStatusBadgeClass(viewEvent.status)}`}>
                      {viewEvent.status}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>Registrations:</strong><br />
                    <span className="text-muted">{viewEvent.registrations}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>Revenue:</strong><br />
                    <span className="text-muted fw-semibold">${viewEvent.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewEvent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && eventToDelete && (
        <ConfirmationModal
          eventName={eventToDelete.name}
          onConfirm={executeDelete}
          onCancel={() => {
            setShowConfirm(false);
            setEventToDelete(null);
          }}
        />
      )}
    </div>
  );
}
