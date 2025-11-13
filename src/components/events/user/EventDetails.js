// EventDetails.js
import React, { useState, useEffect } from 'react';
import MovieTabs from './MovieTabs';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getEventImages, getEventById } from '../../../services/eventService';
import Modal from '../../ui/Modal';

const EventDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL params
  
  const [event, setEvent] = useState(location.state?.event || { eventId: id, Id: id });
  const [loading, setLoading] = useState(false);

  // State for banner and thumbnail URLs
  const [bannerUrl, setBannerUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Booking click handler: only allow customers (non-admin) to book tickets
  const handleBookClick = () => {
    const storedRole = localStorage.getItem('role');
    if (!storedRole) {
      // Not signed in, go to login
      navigate('/login', { state: { redirectTo: `/book/${event?.Id}` } });
    } else if (storedRole.toUpperCase() === 'CUSTOMER') {
      // Signed in as customer, proceed to booking
      navigate(`/book/${event?.Id}`, { state: { event } });
    } else {
      // Signed in as admin/organizer, show modal
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleLoginAsCustomer = () => {
    setShowModal(false);
    navigate('/login', { state: { redirectTo: `/book/${event?.Id}` } });
  };

  // Fetch fresh event data from API
  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await getEventById(id);
        if (response.success && response.data) {
          const apiEvent = response.data;
          // Map API response to component expected format
          setEvent({
            Id: apiEvent.eventId,
            Name: apiEvent.eventName,
            Location: apiEvent.eventLocation,
            StartDate: apiEvent.eventStartDate ? apiEvent.eventStartDate.split('T')[0] : '',
            EndDate: apiEvent.eventEndDate ? apiEvent.eventEndDate.split('T')[0] : '',
            Time: apiEvent.eventStartDate 
              ? (() => {
                  const startTime = new Date(apiEvent.eventStartDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const endTime = apiEvent.eventEndDate 
                    ? new Date(apiEvent.eventEndDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : null;
                  return endTime ? `${startTime} - ${endTime}` : startTime;
                })()
              : '10:00 AM',
            Cost: apiEvent.eventTicketPrice || 0,
            eventType: apiEvent.eventType,
            eventCategory: apiEvent.eventCategory,
            eventMode: apiEvent.eventMode,
            eventStatus: apiEvent.eventStatus,
            eventDescr: apiEvent.eventDescr,
            totalSeats: apiEvent.eventTotalSeats,
            eventTotalSeats: apiEvent.eventTotalSeats,
            availableSeats: apiEvent.eventSeatsAvailable ?? apiEvent.eventTotalSeats,
            eventSeatsAvailable: apiEvent.eventSeatsAvailable,
            // Keep any additional fields from location.state
            ...(location.state?.event || {}),
            // Override with fresh API data
            eventId: apiEvent.eventId,
            eventName: apiEvent.eventName,
          });
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, location.state]);

  // Fetch banner and thumbnail images
  useEffect(() => {
    if (!event?.Id) return;

    const fetchImages = async () => {
      const response = await getEventImages(event.Id);
      if (response.success && response.data && Array.isArray(response.data)) {
        const banner = response.data.find(img => img.imageType === 'banner');
        const thumbnail = response.data.find(img => img.imageType === 'thumbnail');

        if (banner && banner.imagePath) {
          setBannerUrl(`http://localhost:8080/organizer${banner.imagePath}`);
        }
        if (thumbnail && thumbnail.imagePath) {
          setThumbnailUrl(`http://localhost:8080/organizer${thumbnail.imagePath}`);
        }
      }
    };

    fetchImages();
  }, [event?.Id]);

  if (!event) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-vh-content d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-content" style={{ backgroundColor: '#ffff' }}>
      <div
        className="position-relative text-light"
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
        }}
      >
        <div className="py-4" style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '0.5rem' }}>
          <div className="row align-items-start">
            <div className="col-lg-4 mb-3">
              <div
                className="rounded w-100"
                style={{
                  backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '320px',
                  backgroundColor: thumbnailUrl ? 'transparent' : '#ccc', // Fallback color if no image
                }}
              ></div>
            </div>

            {/* Middle Column (Details) */}
            <div className="col-lg-5 mb-3 text-light">
              <div className="p-3 rounded" style={{ background: 'rgba(0,0,0,0.45)' }}>
                <h2 className="h4 mb-3">{event.Name}</h2>

                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-calendar-event me-2"></i>
                    <span>{event.StartDate}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-clock me-2"></i>
                    <span>{event.Time}</span>
                  </div>
                </div>

                <p className="mb-3">
                  <i className="bi bi-tag me-2"></i>
                  <strong>Category:</strong> {event.eventType}
                </p>
                <p className="mb-3">
                  <i className="bi bi-geo-alt me-2"></i>
                  <strong>Location:</strong> {event.Location}
                </p>
                <p className="mb-3">
                  <i className="bi bi-currency-rupee me-2"></i>
                  <strong>Price:</strong> {event.Cost > 0 ? `₹${event.Cost}` : 'Free'}
                </p>
                <p className="mb-3">
                  <i className="bi bi-people me-2"></i>
                  <strong>Available Seats:</strong> {event.availableSeats ?? event.eventSeatsAvailable ?? event.totalSeats ?? event.eventTotalSeats ?? 'N/A'}/{event.totalSeats ?? event.eventTotalSeats ?? 'N/A'}
                </p>
                <p className="mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Description:</strong> {event.eventDescr || 'No description available.'}
                </p>
                <button className="btn btn-danger rounded-pill px-4 py-2 fw-semibold" onClick={handleBookClick}>
                  Book Tickets
                </button>
              </div>
            </div>

            {/* Empty col to let banner background show */}
            <div className="col-lg-3 d-none d-lg-block"></div>
          </div>
        </div>

        {/* Share Button */}
        <button
          className="btn btn-dark position-absolute d-flex align-items-center"
          style={{ top: '15px', right: '20px', borderRadius: '8px' }}
        >
          <i className="bi bi-share"></i> Share
        </button>
      </div>

      {/* Modal for non-customer users */}
      <Modal show={showModal} onClose={handleModalClose}>
        <div className="text-center">
          <h5 className="mb-3">Customer Login Required</h5>
          <p>To book tickets for events, you need to be logged in as a customer.</p>
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleLoginAsCustomer}>
              Login as Customer
            </button>
            <button className="btn btn-secondary" onClick={handleModalClose}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <MovieTabs event={event} onBook={handleBookClick} />
    </div>
  );
};

export default EventDetails;
