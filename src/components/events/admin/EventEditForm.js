import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EventForm from './EventForm'; // The reusable form we made earlier
import { useParams } from 'react-router-dom';

export default function EventEditForm() {
  const { id } = useParams(); // assuming route like /events/edit/:id
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        setEventData(res.data);
      } catch (err) {
        console.error('Error fetching event:', err);
        alert('Could not load event details');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return <p>Loading event details...</p>;
  if (!eventData) return <p>Event not found</p>;

  return (
    <div>
      <h1>Edit Event</h1>
      <EventForm existingEvent={eventData} />
    </div>
  );
}
