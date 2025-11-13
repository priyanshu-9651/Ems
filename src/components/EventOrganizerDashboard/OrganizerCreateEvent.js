import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { createEvent, updateEvent, uploadEventImage, getEventImages, deleteEventImage } from '../../services/eventService';
import SeatMap from '../events/user/SeatMap';
import { useFormik } from 'formik';
import { clearAuthData } from '../../utils/jwt';

export function OrganizerCreateEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode;
  const editEventData = location.state?.eventData;

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
    seatLayout: '',
  });
  const [bannerImages, setBannerImages] = useState([]); // Array of { file, previewUrl }
  const [thumbnailImages, setThumbnailImages] = useState([]); // Array of { file, previewUrl }
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [bannerInputKey, setBannerInputKey] = useState(0);
  const [thumbnailInputKey, setThumbnailInputKey] = useState(0);
  const [replacingImage, setReplacingImage] = useState(null); // { type: 'banner'|'thumbnail', index: number }
  const [rows, setRows] = useState('A,B,C,D,E,F');
  const [columns, setColumns] = useState(10);

  useEffect(() => {
    if (isEditMode && editEventData) {
      let totalSeats = editEventData.eventTotalSeats || 0;
      if (editEventData.seatLayout && editEventData.eventRequiresSeat !== false) {
        try {
          const layout = JSON.parse(editEventData.seatLayout);
          setRows(layout.rows.join(','));
          setColumns(layout.columns);
          totalSeats = layout.rows.length * layout.columns;
        } catch (e) {
          // ignore parse errors
        }
      }
      // Extract date and time from datetime string for datetime-local input
      const extractDateTime = (datetime) => {
        if (!datetime) return '';
        const dt = new Date(datetime);
        // Format: yyyy-MM-ddTHH:mm for datetime-local input
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setEventData({
        eventName: editEventData.eventName || '',
        eventDescr: editEventData.eventDescr || '',
        eventStartDate: extractDateTime(editEventData.eventStartDate),
        eventEndDate: extractDateTime(editEventData.eventEndDate),
        eventLocation: editEventData.eventLocation || '',
        eventCategory: editEventData.eventCategory || '',
        eventType: editEventData.eventType || 'Conference',
        eventStatus: editEventData.eventStatus || 'DRAFT',
        eventMode: editEventData.eventMode || 'OFFLINE',
        eventRequiresSeat: editEventData.eventRequiresSeat !== false,
        eventTicketPrice: editEventData.eventTicketPrice || 0,
        eventTotalSeats: totalSeats,
        seatLayout: editEventData.seatLayout || '',
      });
      
      // Load existing images for the event
      loadExistingImages(editEventData.eventId);
      setStep(2); // Skip to image upload step if in edit mode
    }
  }, [isEditMode, editEventData]);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
    // Clear all auth data using centralized function
    clearAuthData();
    navigate('/');
  };

  // Simple validate function (no Yup) — mirrors backend rules minimally
  const validate = (values) => {
    const errs = {};
    if (!values.eventDescr || values.eventDescr.trim().length < 10) errs.eventDescr = 'Description must be at least 10 characters';
    if (values.eventDescr && values.eventDescr.length > 5000) errs.eventDescr = 'Description must be 5000 characters or less';
    if (!values.eventStartDate) errs.eventStartDate = 'Start date & time is required';
    if (!values.eventEndDate) errs.eventEndDate = 'End date & time is required';
    if (!values.eventLocation || values.eventLocation.trim().length < 3) errs.eventLocation = 'Location is required (min 3 chars)';
    if (values.eventLocation && values.eventLocation.length > 200) errs.eventLocation = 'Location must be 200 characters or less';
    if (!values.eventCategory) errs.eventCategory = 'Category is required';
    if (typeof values.eventTicketPrice === 'number' && (values.eventTicketPrice < 0 || values.eventTicketPrice > 1000000)) errs.eventTicketPrice = 'Price out of range';
    // eventTotalSeats validation is handled on submit because it depends on seat layout or manual input
    return errs;
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      eventName: eventData.eventName || '',
      eventDescr: eventData.eventDescr || '',
      eventStartDate: eventData.eventStartDate || '',
      eventEndDate: eventData.eventEndDate || '',
      eventLocation: eventData.eventLocation || '',
      eventCategory: eventData.eventCategory || '',
      eventType: eventData.eventType || 'Conference',
      eventStatus: eventData.eventStatus || 'DRAFT',
      eventMode: eventData.eventMode || 'OFFLINE',
      eventRequiresSeat: eventData.eventRequiresSeat || false,
      eventTicketPrice: eventData.eventTicketPrice || 0,
      eventTotalSeats: eventData.eventTotalSeats || 0,
    },
    validate,
    onSubmit: (values) => {
      // Additional validations not covered by simple validate()
      const currentDate = new Date();
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0,0,0,0);

      const startDate = new Date(values.eventStartDate);
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0,0,0,0);
      if (startDateOnly < tomorrow) {
        formik.setErrors({ eventStartDate: 'Start date must be at least one day after today' });
        return;
      }

      if (values.eventEndDate) {
        const endDate = new Date(values.eventEndDate);
        if (endDate <= startDate) {
          formik.setErrors({ eventEndDate: 'End date and time must be after the start date and time' });
          return;
        }
      }

      // Seat validation
      if (values.eventRequiresSeat) {
        const layoutRows = rows.split(',').map(r => r.trim()).filter(r => r);
        if (!layoutRows.length || columns < 1) {
          formik.setErrors({ eventTotalSeats: 'Provide valid seat rows and columns' });
          return;
        }
        const totalSeats = layoutRows.length * columns;
        setEventData(prev => ({ ...prev, ...values, seatLayout: JSON.stringify({ rows: layoutRows, columns }), eventTotalSeats: totalSeats }));
      } else {
        if (!values.eventTotalSeats || values.eventTotalSeats < 1) {
          formik.setErrors({ eventTotalSeats: 'Please provide a valid total number of seats (minimum 1)' });
          return;
        }
        setEventData(prev => ({ ...prev, ...values, seatLayout: '', eventTotalSeats: values.eventTotalSeats }));
      }

      setError('');
      setStep(2);
    }
  });

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (bannerImages.length > 3) {
      setError('Maximum 3 banner images allowed');
      return;
    }
    // Only require thumbnail images for new events, not for edits
    if (!isEditMode && (thumbnailImages.length < 3 || thumbnailImages.length > 10)) {
      setError('Please upload 3-10 thumbnail images');
      return;
    }
    if (isEditMode && thumbnailImages.length > 10) {
      setError('Maximum 10 thumbnail images allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let eventId;
      let response;

      const preparedEventData = {
        ...eventData,
        // ensure description does not exceed frontend configured limit to avoid server truncation
        eventDescr: eventData.eventDescr ? String(eventData.eventDescr).slice(0, 5000) : eventData.eventDescr,
        eventStartDate: eventData.eventStartDate 
          ? `${eventData.eventStartDate}:00`
          : null,
        eventEndDate: eventData.eventEndDate
          ? `${eventData.eventEndDate}:00`
          : null,
      };

      console.log('Event data being sent to backend:', preparedEventData);

      if (isEditMode && editEventData) {
        // Update the event
        response = await updateEvent(editEventData.eventId, preparedEventData);
        if (response.success) {
          eventId = editEventData.eventId;
        } else {
          // Map server-side validation errors back to formik if provided
          if (response.data && response.data.errors && typeof response.data.errors === 'object') {
            formik.setErrors(response.data.errors);
            setStep(1);
            return;
          }
          setError(response.error || response.rawText || 'Failed to update event');
          return;
        }
      } else {
        // Create new event
        response = await createEvent(preparedEventData);
        if (response.success) {
          eventId = response.data.eventId;
        } else {
          if (response.data && response.data.errors && typeof response.data.errors === 'object') {
            formik.setErrors(response.data.errors);
            setStep(1);
            return;
          }
          setError(response.error || response.rawText || 'Failed to create event');
          return;
        }
      }

      // Handle replaced images first
      const replacedImages = existingImages.filter(img => img.isReplaced);
      for (const image of replacedImages) {
        await uploadEventImage(image.file, eventId, image.imageType);
        // Mark the old image for deletion
        await deleteEventImage(image.imageId);
      }

      // Delete images marked for deletion (only non-replaced ones)
      for (const imageId of imagesToDelete) {
        const image = existingImages.find(img => img.imageId === imageId);
        if (image && !image.isReplaced) {
          await deleteEventImage(imageId);
        }
      }

      // Upload new banner images and associate them
      for (const image of bannerImages) {
        await uploadEventImage(image.file, eventId, 'banner');
      }

      // Upload new thumbnail images and associate them
      for (const image of thumbnailImages) {
        await uploadEventImage(image.file, eventId, 'thumbnail');
      }

      alert(`Event ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate('/organizer/events');
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} event. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (replacingImage && replacingImage.type === 'banner') {
      // Replace existing image
      if (files.length === 1) {
        const file = files[0];
        const previewUrl = URL.createObjectURL(file);
        setExistingImages(prev => prev.map((img, idx) => 
          idx === replacingImage.index 
            ? { ...img, file, previewUrl, isReplaced: true }
            : img
        ));
        setReplacingImage(null);
        setBannerInputKey(prev => prev + 1);
        e.target.value = '';
        return;
      }
    }
    
    // Add new images
    if (files.length + bannerImages.length > 3) {
      alert('Maximum 3 banner images allowed');
      e.target.value = '';
      return;
    }
    const previews = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setBannerImages(prev => [...prev, ...previews]);
    setBannerInputKey(prev => prev + 1);
    e.target.value = '';
  };

  const handleThumbnailUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (replacingImage && replacingImage.type === 'thumbnail') {
      // Replace existing image
      if (files.length === 1) {
        const file = files[0];
        const previewUrl = URL.createObjectURL(file);
        setExistingImages(prev => prev.map((img, idx) => 
          idx === replacingImage.index 
            ? { ...img, file, previewUrl, isReplaced: true }
            : img
        ));
        setReplacingImage(null);
        setThumbnailInputKey(prev => prev + 1);
        e.target.value = '';
        return;
      }
    }
    
    // Add new images
    if (files.length + thumbnailImages.length > 10) {
      alert('Maximum 10 thumbnail images allowed');
      e.target.value = '';
      return;
    }
    const previews = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setThumbnailImages(prev => [...prev, ...previews]);
    setThumbnailInputKey(prev => prev + 1);
    e.target.value = '';
  };

  const removeBannerImage = (index) => {
    setBannerImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const removeThumbnailImage = (index) => {
    setThumbnailImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const loadExistingImages = async (eventId) => {
    try {
      const response = await getEventImages(eventId);
      if (response.success) {
        setExistingImages(response.data);
      }
    } catch (error) {
      console.error('Error loading existing images:', error);
    }
  };

  const markImageForDeletion = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.imageId !== imageId));
  };

  useEffect(() => {
    return () => {
      bannerImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
      thumbnailImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
      existingImages.forEach(image => {
        if (image.isReplaced && image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, [bannerImages, thumbnailImages, existingImages]);

  // Get minimum datetime for start date (tomorrow)
  const getMinStartDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00`;
  };

  // Get minimum datetime for end date (must be after start date)
  const getMinEndDateTime = () => {
    if (formik.values.eventStartDate) {
      return formik.values.eventStartDate;
    }
    return getMinStartDateTime();
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
          <p className="text-muted">
            {isEditMode 
              ? 'Update your event details and images.' 
              : 'Fill in the event details and upload images to create your event.'
            }
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/organizer/events')}
          >
            Back to Events
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/organizer/settings')}
          >
            <i className="bi bi-person"></i>
          </button>
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={() => navigate('/organizer/settings')}
          >
            <i className="bi bi-gear"></i>
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
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
        <form onSubmit={formik.handleSubmit}>
          <h4 className="mb-4">Event Details</h4>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Event Name *</label>
              <input
                type="text"
                className="form-control"
                name="eventName"
                value={formik.values.eventName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.eventName && formik.errors.eventName ? (
                <div className="invalid-feedback d-block">
                  {formik.errors.eventName}
                </div>
              ) : null}
            </div>
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-control"
                name="eventCategory"
                value={formik.values.eventCategory}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Start Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                name="eventStartDate"
                value={formik.values.eventStartDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min={getMinStartDateTime()}
                required
              />
              {formik.touched.eventStartDate && formik.errors.eventStartDate ? (
                <div className="invalid-feedback d-block">
                  {formik.errors.eventStartDate}
                </div>
              ) : null}
            </div>
            <div className="col-md-6">
              <label className="form-label">End Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                name="eventEndDate"
                value={formik.values.eventEndDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min={getMinEndDateTime()}
              />
              {formik.touched.eventEndDate && formik.errors.eventEndDate ? (
                <div className="invalid-feedback d-block">
                  {formik.errors.eventEndDate}
                </div>
              ) : null}
            </div>
            <div className="col-md-6">
              <label className="form-label">Location *</label>
              <input
                type="text"
                className="form-control"
                name="eventLocation"
                value={formik.values.eventLocation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.eventLocation && formik.errors.eventLocation ? (
                <div className="invalid-feedback d-block">
                  {formik.errors.eventLocation}
                </div>
              ) : null}
            </div>
            <div className="col-md-6">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                name="eventType"
                value={formik.values.eventType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                rows="6"
                name="eventDescr"
                value={formik.values.eventDescr}
                onChange={(e) => {
                  const max = 5000;
                  let v = e.target.value || '';
                  if (v.length > max) v = v.slice(0, max);
                  formik.setFieldValue('eventDescr', v);
                }}
                onBlur={formik.handleBlur}
                maxLength={5000}
              ></textarea>
              <div className="d-flex justify-content-between align-items-center mt-1">
                {formik.touched.eventDescr && formik.errors.eventDescr ? (
                  <div className="invalid-feedback d-block">
                    {formik.errors.eventDescr}
                  </div>
                ) : (
                  <div></div>
                )}
                <small className={formik.values.eventDescr && formik.values.eventDescr.length >= 5000 ? 'text-danger' : 'text-muted'}>
                  {formik.values.eventDescr ? formik.values.eventDescr.length : 0}/5000
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="eventStatus"
                value={formik.values.eventStatus}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                name="eventMode"
                value={formik.values.eventMode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                name="eventTicketPrice"
                value={formik.values.eventTicketPrice}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Requires Seat</label>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="eventRequiresSeat"
                  checked={formik.values.eventRequiresSeat}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
            </div>
          </div>
          
          {!formik.values.eventRequiresSeat && (
            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <label className="form-label">Total Seats</label>
                <input
                  type="number"
                  className="form-control"
                  name="eventTotalSeats"
                  value={formik.values.eventTotalSeats}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min="1"
                />
              </div>
            </div>
          )}

          {formik.values.eventRequiresSeat && (
            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <label className="form-label">Seat Rows (comma-separated, e.g., A,B,C,D,E,F)</label>
                <input
                  type="text"
                  className="form-control"
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                  placeholder="A,B,C,D,E,F"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Seat Columns</label>
                <input
                  type="number"
                  className="form-control"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 10)}
                  min="1"
                />
              </div>
              <div className="col-12">
                <h6>Seat Map Preview</h6>
                <small className="text-muted">This is a preview of the seat layout. All seats are treated equally.</small>
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  <SeatMap
                    layout={{
                      rows: rows.split(',').map(r => r.trim()).filter(r => r),
                      columns: columns
                    }}
                    basePrice={formik.values.eventTicketPrice}
                    blocked={[]}
                    value={[]}
                    onChange={() => {}} // Preview only
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <button type="submit" className="btn btn-primary">
              Next: Upload Images
            </button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/organizer/events')}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleImageSubmit}>
          <h4 className="mb-4">Upload Images</h4>

          {/* Existing Images */}
          {isEditMode && existingImages.length > 0 && (
            <div className="mb-4">
              <h5>Existing Images</h5>
              {replacingImage && (
                <div className="alert alert-info mb-2">
                  Select a new {replacingImage.type} image to replace the selected one. 
                  <button 
                    type="button" 
                    className="btn btn-sm btn-link p-0 ms-2" 
                    onClick={() => setReplacingImage(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {existingImages.map((image, index) => (
                  <div key={image.imageId} className="position-relative">
                    <img
                      src={image.isReplaced ? image.previewUrl : `http://localhost:8080/organizer${image.imagePath}`}
                      alt={image.imageType}
                      style={{ 
                        width: image.imageType === 'banner' ? 100 : 80, 
                        height: 60, 
                        objectFit: 'cover', 
                        borderRadius: 4,
                        cursor: 'pointer',
                        opacity: replacingImage?.type === image.imageType && replacingImage?.index === index ? 0.5 : 1
                      }}
                      onClick={() => setReplacingImage({ type: image.imageType, index })}
                      title="Click to replace this image"
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0"
                      onClick={() => markImageForDeletion(image.imageId)}
                      style={{ fontSize: '10px', padding: '2px 6px' }}
                      title="Remove this image"
                    >
                      ×
                    </button>
                    <div className="badge bg-secondary position-absolute bottom-0 start-0" style={{ fontSize: '10px' }}>
                      {image.imageType}
                    </div>
                    {image.isReplaced && (
                      <div className="badge bg-warning position-absolute top-0 start-0" style={{ fontSize: '10px' }}>
                        New
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <small className="text-muted">Click an image to replace it, or click × to remove it</small>
            </div>
          )}

          {/* Banner Images */}
          <div className="mb-4">
            <h5>Banner Images (Max 3)</h5>
            {replacingImage?.type === 'banner' ? (
              <div className="alert alert-info">
                Select a new banner image to replace the selected one.
              </div>
            ) : (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="form-control mb-2"
                  key={bannerInputKey}
                />
                <small className="text-muted">Upload up to 3 banner images for your event</small>
              </>
            )}
            <div className="d-flex flex-wrap gap-2 mt-2">
              {bannerImages.map((image, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={image.previewUrl}
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
            <h5>Thumbnail Images {isEditMode ? '(Optional)' : '(3-10 required)'}</h5>
            {replacingImage?.type === 'thumbnail' ? (
              <div className="alert alert-info">
                Select a new thumbnail image to replace the selected one.
              </div>
            ) : (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="form-control mb-2"
                  key={thumbnailInputKey}
                />
                <small className="text-muted">Upload 3-10 thumbnail images for your event gallery</small>
              </>
            )}
            <div className="d-flex flex-wrap gap-2 mt-2">
              {thumbnailImages.map((image, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={image.previewUrl}
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
              {loading ? (isEditMode ? 'Updating Event...' : 'Creating Event...') : (isEditMode ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
