import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventImages } from '../../../services/eventService';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const {
    Id,
    Name,
    StartDate,
    Time,
    Location,
    Cost,
    availableSeats,
    totalSeats,
    Photo,
    eventType,
  } = event || {};

  // Local state for available seats so the card updates when bookings happen elsewhere
  const [localAvailable, setLocalAvailable] = useState(
    typeof availableSeats === 'number' ? availableSeats : (typeof totalSeats === 'number' ? totalSeats : 0)
  );

  // State for thumbnail image URL
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    // Keep localAvailable in sync if parent prop changes
    if (typeof availableSeats === 'number') setLocalAvailable(availableSeats);
  }, [availableSeats]);

  useEffect(() => {
    const onEventsUpdated = (e) => {
      try {
        const detail = e?.detail || {};
        if (!detail) return;
        if ((detail.eventId || detail.EventId || detail.Id) == Id) {
          if (typeof detail.availableSeats === 'number') setLocalAvailable(detail.availableSeats);
        }
      } catch (err) {
        // ignore
      }
    };

    const onStorage = (e) => {
      if (e.key === 'events') {
        try {
          const map = e.newValue ? JSON.parse(e.newValue) : {};
          if (map && map[Id] && typeof map[Id].availableSeats === 'number') {
            setLocalAvailable(map[Id].availableSeats);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('eventsUpdated', onEventsUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('eventsUpdated', onEventsUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [Id]);

  // Fetch thumbnail image
  useEffect(() => {
    if (!Id) return;

    const fetchThumbnail = async () => {
      console.log(`Fetching images for event ${Id}`);
      const response = await getEventImages(Id);
      console.log('Response:', response);
      if (response.success && response.data && Array.isArray(response.data)) {
        const thumbnail = response.data.find(img => img.imageType === 'thumbnail');
        console.log('Thumbnail found:', thumbnail);
        if (thumbnail && thumbnail.imagePath) {
          const fullUrl = `http://localhost:8080/organizer${thumbnail.imagePath}`;
          console.log('Setting thumbnail URL:', fullUrl);
          setThumbnailUrl(fullUrl);
        } else {
          console.log('No thumbnail found, setting to null');
          setThumbnailUrl(null);
        }
      } else {
        console.log('Failed to fetch images or no data');
        setThumbnailUrl(null);
      }
    };

    fetchThumbnail();
  }, [Id]);

  const handleClick = () => {
    navigate(`/event/${Id}`, { state: { event } });
  };

  return (
    <div
      className="card shadow-sm border-0 rounded-4 overflow-hidden"
      style={{ width: '20rem', cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Image with badges */}
      <div className="position-relative">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} className="card-img-top" alt={Name} />
        ) : (
          <div
            className="card-img-top d-flex align-items-center justify-content-center bg-primary text-white"
            style={{ height: '200px', fontSize: '4rem', fontWeight: 'bold' }}
          >
            {Name ? Name.charAt(0).toUpperCase() : 'E'}
          </div>
        )}
        <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2 border">
          {eventType}
        </span>
      </div>

      {/* Card Body */}
      <div className="card-body">
        <h5 className="card-title fw-bold">{Name}</h5>

        <p className="text-muted mb-1">
          <i className="bi bi-calendar-event me-2"></i>
          {StartDate}
        </p>
        
        <p className="text-muted mb-1">
          <i className="bi bi-clock me-2"></i>
          {Time}
        </p>

        <p className="text-muted mb-1">
          <i className="bi bi-geo-alt me-2"></i>
          {Location}
        </p>

        <p className="text-warning mb-3">
          <i className="bi bi-star-fill me-1"></i> 4.6
          <span className="text-muted"> (189 reviews)</span>
        </p>

        <div className="d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-success mb-0">
            {typeof Cost === 'number' && Cost > 0 ? `₹${Cost}` : 'Free'}
          </h5>
         
        </div>
      </div>
    </div>
  );
};

export default EventCard;
