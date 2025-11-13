// MovieTabs.js
import React, { useState, useEffect } from 'react';
import { getEventImages } from '../../../services/eventService';

const MovieTabs = ({ event, onBook }) => {
  const [activeTab, setActiveTab] = useState('synopsis');
  const [allImages, setAllImages] = useState([]);

  const tabs = [
    { id: 'synopsis', label: 'Synopsis' },
    { id: 'location', label: 'Location' },
    { id: 'posters', label: 'Gallery' },
    { id: 'reviews', label: 'Reviews' },
  ];

  // Fetch all event images for gallery
  useEffect(() => {
    if (!event?.Id) return;

    const fetchImages = async () => {
      const response = await getEventImages(event.Id);
      if (response.success && response.data && Array.isArray(response.data)) {
        setAllImages(response.data);
      }
    };

    fetchImages();
  }, [event?.Id]);

  return (
    <div className="mt-4 container">
      {/* Section Title */}
      <h4 className="fw-bold mb-3 text-dark">About the Event</h4>

      {/* horizontal nav bar */}
      <div className="d-flex mb-4 flex-wrap align-items-center justify-content-center gap-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn fw-semibold me-2 mb-2 ${
              activeTab === tab.id ? 'text-white' : 'text-dark'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? '#e74c3c' : '#f8f9fa',
              border: '2px solid #ddd',
              borderRadius: '30px',
              padding: '7px 21px',
              transition: '0.3s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Box */}
      <div className="p-4 border rounded bg-light">
        {activeTab === 'synopsis' && (
          <div>
            <p className="mb-3">{event?.eventDescr || 'No description available.'}</p>

            {/* Event Details */}
            <div className="p-3 border rounded bg-white mb-3">
              <strong>Event Details:</strong>
              <ul className="mt-2 mb-0">
                <li><strong>Category:</strong> {event?.eventType || 'N/A'}</li>
                <li><strong>Mode:</strong> {event?.eventMode || 'N/A'}</li>
                <li><strong>Status:</strong> {event?.eventStatus || 'N/A'}</li>
                <li><strong>Total Seats:</strong> {event?.totalSeats || 'N/A'}</li>
                <li><strong>Start Date:</strong> {event?.StartDate || 'N/A'}</li>
                <li><strong>End Date:</strong> {event?.EndDate || 'N/A'}</li>
              </ul>
            </div>

            {/* Rating + Button */}
            <p className="mb-2">
              <strong>Price:</strong> {event?.Cost > 0 ? `₹${event.Cost}` : 'Free'}
            </p>
            <button
              className="btn px-4 py-2 fw-semibold"
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                borderRadius: '25px',
              }}
              onClick={() => {
                if (typeof onBook === 'function') onBook();
              }}
            >
              Book Now
            </button>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="p-3 border rounded bg-white">
            <h6 className="fw-bold mb-2">Event Location</h6>
            <p className="mb-3">📍 {event?.Location || 'Location not specified'}</p>
            {/* Embedded Google Map */}
            {event?.Location && (
              <div className="mb-3">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(event.Location)}`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Event Location Map"
                ></iframe>
              </div>
            )}
            <a
              href={`https://maps.google.com?q=${encodeURIComponent(event?.Location || '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn px-4 fw-semibold"
              style={{
                backgroundColor: '#34495e',
                color: 'white',
                borderRadius: '25px',
              }}
            >
              Open in Google Maps
            </a>
          </div>
        )}

        {activeTab === 'posters' && (
          <div className="row">
            {allImages.length > 0 ? (
              allImages.map((image, index) => (
                <div key={image.imageId || index} className="col-md-4 mb-3">
                  <img
                    src={`http://localhost:8080/organizer${image.imagePath}`}
                    className="img-fluid rounded shadow-sm"
                    alt={`${image.imageType} ${index + 1}`}
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                  />
                  <p className="text-center mt-1 text-capitalize">{image.imageType}</p>
                </div>
              ))
            ) : (
              <p className="text-center">No images available for this event.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="mb-3">
              <p>⭐ 4/5 - Great event!</p>
              <p>⭐ 3/5 - Enjoyed it.</p>
            </div>

            <textarea
              className="form-control mb-2 p-3"
              rows="3"
              placeholder="Write your review..."
            ></textarea>
            <button
              className="btn fw-semibold"
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                borderRadius: '25px',
              }}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieTabs;
