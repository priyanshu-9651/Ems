import './EventForm.css';
import React, { useState } from 'react';
import axios from 'axios';
// import Footer from '../../home/Footer'; // Removed as it was commented out

export default function EventForm({ existingEvent }) {
  const [formData, setFormData] = useState({
    Name: existingEvent?.Name || '',
    Description: existingEvent?.Description || '',
    StartDate: existingEvent?.StartDate || '',
    EndDate: existingEvent?.EndDate || '',
    Location: existingEvent?.Location || '',
    Category: existingEvent?.Category || '',
    EventType: existingEvent?.EventType || 'Conference',
    EventStatus: existingEvent?.EventStatus || 'Scheduled',
    TotalSeats: existingEvent?.TotalSeats || 0,
    // --- NEW FIELDS ---
    Price: existingEvent?.Price || 0,
    Mode: existingEvent?.Mode || 'OFFLINE',
    RequiresSeat: existingEvent?.RequiresSeat || false,
  });

  const [banner, setBanner] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBanner(file);
      setPreviewBanner(URL.createObjectURL(file));
    }
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files.slice(0, 10));
    setPreviewPhotos(
      files.slice(0, 10).map((file) => URL.createObjectURL(file))
    );
  };

  const handleNext = () => {
    // You can add validation for Step 1 here if needed
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for Step 2
    if (!banner && !existingEvent) { // Only require banner on create
      alert('Banner image is required');
      return;
    }
    if (photos.length < 3 && !existingEvent) { // Only require photos on create
      alert('At least 3 additional photos are required');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    if (banner) {
      data.append('banner', banner);
    }
    if (photos.length > 0) {
      photos.forEach((photo) => data.append('photos', photo));
    }

    try {
      if (existingEvent) {
        await axios.put(`/api/events/${existingEvent.EventID}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Event updated successfully');
      } else {
        await axios.post('/api/events', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Event created successfully');
      }
      // Optionally redirect user after success
    } catch (err) {
      console.error(err);
      alert('Error saving event');
    }
  };

  return (
    <div className="container my-5">
      <div className="d-flex align-items-center mb-4">
        <h4>{existingEvent ? 'Edit Event' : 'Create New Event'}</h4>
      </div>
      <p className="text-muted">Fill in the details below to {existingEvent ? 'edit your' : 'create a new'} event</p>

      {/* Step Indicator */}
      <div className="step-indicator mb-4">
        <div className="step-item">
          <span className={`step-number ${currentStep === 1 ? 'active' : ''}`}>1</span>
          <strong className={currentStep === 1 ? 'text-primary' : 'text-muted'}>
            Event Details
          </strong>
        </div>
        <div className="step-divider"></div>
        <div className="step-item">
          <span className={`step-number ${currentStep === 2 ? 'active' : ''}`}>2</span>
          <strong className={currentStep === 2 ? 'text-primary' : 'text-muted'}>
            Media & Review
          </strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {currentStep === 1 && (
          <div className="card shadow-sm p-4">
            <div className="card-body">
              <h5 className="card-title">Event Information</h5>
              <div className="row g-3">
                
                <div className="col-12">
                  <label htmlFor="eventName" className="form-label">
                    Name of Event <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="eventName"
                    name="Name"
                    placeholder="Enter event name"
                    value={formData.Name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="startDate" className="form-label">
                    Event Start Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    name="StartDate"
                    value={formData.StartDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="endDate" className="form-label">
                    Event End Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    name="EndDate"
                    value={formData.EndDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="eventLocation" className="form-label">
                    Event Location <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="eventLocation"
                    name="Location"
                    placeholder="Enter event location"
                    value={formData.Location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="eventDetails" className="form-label">
                    Event Details <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="eventDetails"
                    name="Description"
                    rows="3"
                    placeholder="Describe your event in detail..."
                    value={formData.Description}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="col-md-4">
                  <label htmlFor="category" className="form-label">
                    Category
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="category"
                    name="Category"
                    placeholder="e.g., Technology"
                    value={formData.Category}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="eventType" className="form-label">
                    Event Type
                  </label>
                  <select
                    className="form-select"
                    id="eventType"
                    name="EventType"
                    value={formData.EventType}
                    onChange={handleChange}
                  >
                    <option value="">-- Select Event Type --</option>
                    <option value="Conference">Conference</option>
                    <option value="Concert">Concert</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="eventStatus" className="form-label">
                    Event Status
                  </label>
                  <select
                    className="form-select"
                    id="eventStatus"
                    name="EventStatus"
                    value={formData.EventStatus}
                    onChange={handleChange}
                  >



                    <option>Active</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="totalSeats" className="form-label">
                    Capacity (Total Seats)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="totalSeats"
                    name="TotalSeats"
                    value={formData.TotalSeats}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                {/* --- FIELD: Price --- */}
                <div className="col-md-6">
                  <label htmlFor="price" className="form-label">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="price"
                    name="Price"
                    value={formData.Price}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                {/* --- FIELD: Mode (UPDATED) --- */}
                <div className="col-md-6">
           
       <label htmlFor="mode" className="form-label">
                    Mode
                  </label>
                  <select
                    className="form-select"
                    id="mode"
                    name="Mode"
                    value={formData.Mode}
                    onChange={handleChange}
                  >
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ONLINE">ONLINE</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>

                {/* --- FIELD: Requires Seat --- */}
                <div className="col-md-6 d-flex align-items-end pb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="requiresSeat"
                      name="RequiresSeat"
                      checked={formData.RequiresSeat}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="requiresSeat">
                      Requires Seat
                    </label>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm p-4 h-100">
                <h5 className="card-title">Event Media</h5>
                <div className="mb-4">
                  <label className="form-label">Banner Image *</label>
                  <div
                    className="upload-box"
                    onClick={() => document.getElementById('banner-upload').click()}
                  >
                    <input
                      type="file"
                      id="banner-upload"
                      accept="image/png, image/jpeg"
                      className="d-none"
                      onChange={handleBannerChange}
                    />
                    {previewBanner ? (
                      <img
                        src={previewBanner}
                        alt="Banner Preview"
                        className="img-fluid upload-preview"
                      />
                    ) : (
                      <>
                        <i className="bi bi-upload upload-icon"></i>
                        <p className="upload-text">Click to upload banner</p>
                        <small className="text-muted">PNG, JPG up to 5MB</small>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="form-label">Additional Photos (min 3) *</label>
                  <div
                    className="upload-box"
                    onClick={() => document.getElementById('photos-upload').click()}
                  >
                    <input
                      type="file"
                      id="photos-upload"
                      accept="image/png, image/jpeg"
                      multiple
                      className="d-none"
                      onChange={handlePhotosChange}
                    />
                    {previewPhotos.length > 0 ? (
                      <div className="row g-2 upload-preview-grid">
                        {previewPhotos.map((src, idx) => (
                          <div key={idx} className="col-4">
                            <img src={src} alt={`Photo ${idx + 1}`} className="img-fluid rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <i className="bi bi-upload upload-icon"></i>
                        <p className="upload-text">Upload multiple photos</p>
                        <small className="text-muted">PNG, JPG up to 5MB each (max 10)</small>
                      </>
                    )}
                  </div>
                  <small className="text-muted mt-2 d-block">
                    {photos.length} / 10 photos uploaded
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm p-4 h-100">
                <h5 className="card-title">Event Summary</h5>
                <dl className="row g-2">
                  <dt className="col-sm-4">Event Name</dt>
                  <dd className="col-sm-8 text-break">{formData.Name || 'N/A'}</dd>
                  <dt className="col-sm-4">Start Date</dt>
                  <dd className="col-sm-8">{formData.StartDate || 'N/A'}</dd>
                  <dt className="col-sm-4">End Date</dt>
                  <dd className="col-sm-8">{formData.EndDate || 'N/A'}</dd>
                  <dt className="col-sm-4">Location</dt>
                  <dd className="col-sm-8">{formData.Location || 'N/A'}</dd>
                  <dt className="col-sm-4">Type</dt>
                  <dd className="col-sm-8">{formData.EventType || 'N/A'}</dd>
                  <dt className="col-sm-4">Status</dt>
                  <dd className="col-sm-8">{formData.EventStatus || 'N/A'}</dd>
                  <dt className="col-sm-4">Capacity</dt>
                  <dd className="col-sm-8">
                    {formData.TotalSeats > 0 ? `${formData.TotalSeats} total seats` : 'N/A'}
                  </dd>
                  <dt className="col-sm-4">Description</dt>
                  <dd className="col-sm-8 text-break">{formData.Description || 'N/A'}</dd>
                  
                  {/* --- SUMMARY FIELDS --- */}
                  <dt className="col-sm-4">Price</dt>
                  <dd className="col-sm-8">${formData.Price || '0.00'}</dd>
                  <dt className="col-sm-4">Mode</dt>
                  <dd className="col-sm-8">{formData.Mode || 'N/A'}</dd>
                  <dt className="col-sm-4">Requires Seat</dt>
                  <dd className="col-sm-8">{formData.RequiresSeat ? 'Yes' : 'No'}</dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="d-flex justify-content-between mt-4">
          {currentStep === 1 ? (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()} // Or use React Router history
            >
              Back
            </button>
          ) : (
            <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          <div>
            <button type="button" className="btn btn-link text-danger text-decoration-none me-2">
              Cancel
            </button>
            {currentStep === 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                {existingEvent ? 'Update Event' : 'Create Event'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}