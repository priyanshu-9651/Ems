import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllEvents } from '../../../services/eventService';
import FilterBar from './FilterBar';
import EventList from './EventList';
import Footer from '../../home/Footer';

const EventsPage = () => {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchQuery || '');
  const [categoryFilter, setCategoryFilter] = useState(location.state?.selectedCategory || 'All Categories');
  const [priceFilter, setPriceFilter] = useState('All Prices');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await getAllEvents();
        if (response.success) {
          const eventsData = response.data;
          // Map API fields to component expected fields for compatibility
          const mappedEvents = eventsData.map((event) => ({
            Id: event.eventId,
            Name: event.eventName,
            Location: event.eventLocation,
            StartDate: event.eventStartDate ? event.eventStartDate.split('T')[0] : '',
            EndDate: event.eventEndDate ? event.eventEndDate.split('T')[0] : '',
            Time: event.eventStartDate 
              ? (() => {
                  const startTime = new Date(event.eventStartDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const endTime = event.eventEndDate 
                    ? new Date(event.eventEndDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : null;
                  return endTime ? `${startTime} - ${endTime}` : startTime;
                })()
              : '10:00 AM',
            StartDateTime: event.eventStartDate,
            EndDateTime: event.eventEndDate,
            Cost: event.eventTicketPrice || 0,
            eventType: event.eventType,
            eventCategory: event.eventCategory,
            eventMode: event.eventMode,
            eventStatus: event.eventStatus,
            eventDescr: event.eventDescr,
            totalSeats: event.eventTotalSeats,
            availableSeats: event.eventSeatsAvailable ?? event.eventTotalSeats, // Use eventSeatsAvailable from API, fallback to total
            Photo: '', // No photo in API, can be added later
            categories: [], // Can be derived from eventType if needed
          }));
          setAllEvents(mappedEvents);
          setEvents(mappedEvents);
          setError(null);
        } else {
          setError('Failed to load events. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Keep events list in sync when other tabs or pages update seat counts
  useEffect(() => {
    const onEventsUpdated = (ev) => {
      try {
        const detail = ev?.detail || {};
        const id = detail.eventId || detail.EventId || detail.eventId;
        if (!id) return;
        const newAvailable = typeof detail.availableSeats === 'number' ? detail.availableSeats : null;
        if (newAvailable === null) return;
        setAllEvents((prev) => prev.map((e) => (e.Id == id ? { ...e, availableSeats: newAvailable } : e)));
        setEvents((prev) => prev.map((e) => (e.Id == id ? { ...e, availableSeats: newAvailable } : e)));
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('eventsUpdated', onEventsUpdated);
    return () => {
      window.removeEventListener('eventsUpdated', onEventsUpdated);
    };
  }, []);

  useEffect(() => {
    let result = [...allEvents];

    // 🔎 Search filter
    if (searchTerm) {
      result = result.filter(
        (eve) =>
          eve.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eve.Location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eve.eventCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eve.eventType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 🏷️ Category filter
    if (categoryFilter !== 'All Categories') {
      result = result.filter((eve) => eve.eventType === categoryFilter);
    }

    // 💰 Price filter
    switch (priceFilter) {
      case 'Free':
        result = result.filter((eve) => eve.Cost === 0);
        break;
      case 'Under ₹50':
        result = result.filter((eve) => eve.Cost > 0 && eve.Cost <= 50);
        break;
      case '₹51 - ₹100':
        result = result.filter((eve) => eve.Cost > 50 && eve.Cost <= 100);
        break;
      case 'Over ₹100':
        result = result.filter((eve) => eve.Cost > 100);
        break;
      default:
        break;
    }

    // 📅 Date filter (exact yyyy-mm-dd match)
    if (dateFilter) {
      result = result.filter((eve) => eve.StartDate === dateFilter);
    }

    setEvents(result);
  }, [searchTerm, categoryFilter, priceFilter, dateFilter, allEvents]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All Categories');
    setPriceFilter('All Prices');
    setDateFilter('');
    setEvents(allEvents);
  };

  return (
    <div className="container">
      <div>
        <h1>Discover Events</h1>
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          clearFilters={clearFilters}
        />
      </div>
      <br />
      <br />
      <div className="events-column">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading events...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : events.length > 0 ? (
          <EventList events={events} />
        ) : (
          <p className="text-center text-muted">No events found for selected filters.</p>
        )}
      </div>
      <div>{/* <Footer /> */}</div>
    </div>
  );
};

export default EventsPage;
