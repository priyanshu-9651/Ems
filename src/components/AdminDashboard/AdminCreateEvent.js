import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../Icons';
import { logoutUser } from '../../services/authService';
import { createEvent } from '../../services/eventService';

export function AdminCreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: details, 2: images
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventData, setEventData] = useState({
    eventName: '',
    eventDescr: '',
    eventStartDate: '',
    eventEndDate: '',
    eventLocation: '',
    eventCategory: '',
    eventType: 'Conference',
    eventStatus: 'DRAFT',
    eventMode: 'OFFLINE',
    eventRequiresSeat: true,
    eventTicketPrice: 0,
    eventTotalSeats: 0,
  });
  const [bannerImages, setBannerImages] = useState([]);
  const [thumbnailImages, setThumbnailImages] = useState([]);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    try {
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
    navigate('/');
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!eventData.eventName || !eventData.eventStartDate || !eventData.eventLocation) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (bannerImages.length > 3) {
      setError('Maximum 3 banner images allowed');
      return;
    }
    if (thumbnailImages.length < 3 || thumbnailImages.length > 10) {
      setError('Please upload 3-10 thumbnail images');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare event data with datetime in Spring Boot LocalDateTime format
      // datetime-local gives us: "2025-12-10T19:00"
      // Spring Boot expects: "2025-12-10T19:00:00"
      const preparedEventData = {
        ...eventData,
        eventStartDate: eventData.eventStartDate 
          ? `${eventData.eventStartDate}:00`
          : null,
        eventEndDate: eventData.eventEndDate
          ? `${eventData.eventEndDate}:00`
          : null,
      };

      console.log('Event data being sent to backend:', preparedEventData);

      // Create the event first
      const response = await createEvent(preparedEventData);
      if (response.success) {
        // TODO: Upload images here when APIs are available
        alert('Event created successfully!');
        navigate('/admin/events');
      } else {
        setError(response.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + bannerImages.length > 3) {
      alert('Maximum 3 banner images allowed');
      return;
    }
    setBannerImages(prev => [...prev, ...files]);
  };

  const handleThumbnailUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + thumbnailImages.length > 10) {
      alert('Maximum 10 thumbnail images allowed');
      return;
    }
    setThumbnailImages(prev => [...prev, ...files]);
  };

  const removeBannerImage = (index) => {
    setBannerImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeThumbnailImage = (index) => {
    setThumbnailImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="p-3">
          <h5>Admin Panel</h5>
          <nav className="nav flex-column">
            <a className="nav-link" href="/admin/dashboard">Dashboard</a>
            <a className="nav-link active" href="/admin/events">Events</a>
            <a className="nav-link" href="/admin/users">Users</a>
            <a className="nav-link" href="/admin/settings">Settings</a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h1">Create New Event</span>
            <div className="d-flex gap-2">
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
        </nav>

        {/* Progress Indicator */}
        <div className="p-3">
          <div className="progress mb-4">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: step === 1 ? '50%' : '100%' }}
              aria-valuenow={step === 1 ? 50 : 100} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              Step {step} of 2
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleDetailsSubmit}>
              <h4 className="mb-4">Event Details</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Event Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={eventData.eventName}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventName: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={eventData.eventCategory}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventCategory: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={eventData.eventStartDate}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventStartDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={eventData.eventEndDate}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventEndDate: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={eventData.eventLocation}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventLocation: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={eventData.eventType}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventType: e.target.value }))}
                  >
                    <option value="">-- Select Event Type --</option>
                    <option value="Conference">Conference</option>
                    <option value="Concert">Concert</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={eventData.eventDescr}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventDescr: e.target.value }))}
                  ></textarea>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={eventData.eventStatus}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventStatus: e.target.value }))}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Mode</label>
                  <select
                    className="form-select"
                    value={eventData.eventMode}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventMode: e.target.value }))}
                  >
                    <option value="OFFLINE">Offline</option>
                    <option value="ONLINE">Online</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Ticket Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={eventData.eventTicketPrice}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventTicketPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Total Seats</label>
                  <input
                    type="number"
                    className="form-control"
                    value={eventData.eventTotalSeats}
                    onChange={(e) => setEventData(prev => ({ ...prev, eventTotalSeats: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Requires Seat</label>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={eventData.eventRequiresSeat}
                      onChange={(e) => setEventData(prev => ({ ...prev, eventRequiresSeat: e.target.checked }))}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button type="submit" className="btn btn-primary">
                  Next: Upload Images
                </button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/admin/events')}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleImageSubmit}>
              <h4 className="mb-4">Upload Images</h4>
              
              {/* Banner Images */}
              <div className="mb-4">
                <h5>Banner Images (Max 3)</h5>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="form-control mb-2"
                />
                <small className="text-muted">Upload up to 3 banner images for your event</small>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {bannerImages.map((file, index) => (
                    <div key={index} className="position-relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Banner ${index + 1}`}
                        style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                        onClick={() => removeBannerImage(index)}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="mb-4">
                <h5>Thumbnail Images (3-10 required)</h5>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="form-control mb-2"
                />
                <small className="text-muted">Upload 3-10 thumbnail images for your event gallery</small>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {thumbnailImages.map((file, index) => (
                    <div key={index} className="position-relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Thumbnail ${index + 1}`}
                        style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                        onClick={() => removeThumbnailImage(index)}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary ms-2" disabled={loading}>
                  {loading ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
