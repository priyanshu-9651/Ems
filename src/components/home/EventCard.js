import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Star } from 'lucide-react';
import { getAllEvents, getEventImages } from '../../services/eventService';
import { useNavigate } from 'react-router-dom';

function EventCard() {
	const navigate = useNavigate();
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchRandomEvents = async () => {
			try {
				setLoading(true);
				const response = await getAllEvents();
				
				if (response.success && response.data && response.data.length > 0) {
					// Get random 3 events
					const shuffled = response.data.sort(() => 0.5 - Math.random());
					const randomEvents = shuffled.slice(0, Math.min(3, shuffled.length));

					// Fetch images and map data for each event
					const eventsWithData = await Promise.all(
						randomEvents.map(async (event) => {
							try {
								const imageResponse = await getEventImages(event.eventId);
								const bannerImage = imageResponse.success && imageResponse.data && imageResponse.data.length > 0
									? imageResponse.data.find(img => img.imageType === 'banner')
									: null;

								const startDate = event.eventStartDate ? new Date(event.eventStartDate) : null;
								
								return {
									id: event.eventId,
									title: event.eventName || 'Untitled Event',
									date: startDate ? startDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'TBD',
									time: startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD',
									location: event.eventLocation || 'Location TBD',
									rating: 4,
									price: event.eventTicketPrice !== null && event.eventTicketPrice !== undefined ? event.eventTicketPrice : 0,
									image: bannerImage && bannerImage.imagePath
										? `http://localhost:8080/organizer${bannerImage.imagePath}`
										: 'https://via.placeholder.com/400x200?text=Event+Image',
									eventType: event.eventType || 'Event',
								};
							} catch (err) {
								console.error(`Error fetching images for event ${event.eventId}:`, err);
								const startDate = event.eventStartDate ? new Date(event.eventStartDate) : null;
								return {
									id: event.eventId,
									title: event.eventName || 'Untitled Event',
									date: startDate ? startDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'TBD',
									time: startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD',
									location: event.eventLocation || 'Location TBD',
									rating: 4,
									price: event.eventTicketPrice !== null && event.eventTicketPrice !== undefined ? event.eventTicketPrice : 0,
									image: 'https://via.placeholder.com/400x200?text=Event+Image',
									eventType: event.eventType || 'Event',
								};
							}
						})
					);

					setEvents(eventsWithData);
					setError(null);
				} else {
					setError('No events available');
					setEvents([]);
				}
			} catch (err) {
				console.error('Error fetching events:', err);
				setError('Failed to load events');
				setEvents([]);
			} finally {
				setLoading(false);
			}
		};

		fetchRandomEvents();
	}, []);
	return (
		<section className="py-5 bg-white">
			<div className="container">
				<h2 className="h4 fw-semibold mb-4">Featured Events</h2>

				{loading && (
					<div className="text-center py-5">
						<div className="spinner-border" role="status">
							<span className="visually-hidden">Loading...</span>
						</div>
						<p className="mt-2 text-muted">Loading featured events...</p>
					</div>
				)}

				{error && !loading && (
					<div className="alert alert-info text-center">
						{error}. Please check back soon!
					</div>
				)}

				{!loading && events.length === 0 && !error && (
					<div className="alert alert-info text-center">
						No events available at the moment.
					</div>
				)}

				{!loading && events.length > 0 && (
					<div className="row gy-4">
						{events.map((event) => (
							<div key={event.id} className="col-md-6 col-lg-4">
								<div
									className="card shadow-sm h-100 border-0"
									style={{
										overflow: 'hidden',
										transition: 'transform 200ms ease, box-shadow 200ms ease',
										cursor: 'pointer',
										display: 'flex',
										flexDirection: 'column',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = 'translateY(-5px)';
										e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
									}}
								>
									{/* Image Section */}
									<div style={{ position: 'relative', backgroundColor: '#f0f0f0', minHeight: '200px' }}>
										<img
											src={event.image}
											alt={event.title}
											className="card-img-top"
											style={{
												height: '200px',
												objectFit: 'cover',
												width: '100%',
											}}
											onError={(e) => {
												e.target.src = 'https://via.placeholder.com/400x200?text=Event+Image';
											}}
										/>
										{/* Date Badge */}
										<div style={{ position: 'absolute', left: 12, top: 12 }}>
											<span className="badge bg-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
												{event.date}
											</span>
										</div>
										{/* Price Badge */}
										<div style={{ position: 'absolute', right: 12, top: 12 }}>
											<span className="badge bg-light text-dark" style={{ fontSize: '12px', padding: '4px 8px' }}>
												{event.price === 0 ? 'Free' : `₹${event.price}`}
											</span>
										</div>
									</div>

									{/* Content Section */}
									<div className="card-body d-flex flex-column" style={{ flex: 1 }}>
										{/* Title */}
										<h5 className="card-title" style={{ minHeight: '44px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
											{event.title}
										</h5>

										{/* Date and Location */}
										<p className="card-text text-muted mb-3" style={{ fontSize: '13px', lineHeight: '1.4' }}>
											<Calendar size={14} className="me-1" style={{ verticalAlign: 'text-bottom' }} />
											<span>{event.date} {event.time}</span>
											<br />
											<MapPin size={14} className="me-1" style={{ verticalAlign: 'text-bottom' }} />
											<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%' }}>
												{event.location}
											</span>
										</p>

										{/* Rating and Buttons */}
										<div className="d-flex align-items-center justify-content-between mt-auto pt-2" style={{ borderTop: '1px solid #e9ecef' }}>
											{/* Stars */}
											<div className="d-flex align-items-center" style={{ gap: '4px' }}>
												{Array.from({ length: 5 }).map((_, i) => (
													<Star
														key={i}
														size={14}
														className={i < event.rating ? 'text-warning' : 'text-muted'}
														style={{ fill: i < event.rating ? '#ffc107' : 'none' }}
													/>
												))}
												<small className="text-muted ms-1" style={{ fontSize: '12px' }}>
													{event.rating}.0
												</small>
											</div>

											{/* Buttons */}
											<div style={{ display: 'flex', gap: '6px' }}>
												<button 
													className="btn btn-sm btn-outline-primary"
													style={{ fontSize: '12px', padding: '4px 10px' }}
													onClick={() => navigate(`/events/${event.id}`, { state: { event } })}
												>
													Details
												</button>
												<button 
													className="btn btn-sm btn-primary"
													style={{ fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap' }}
													onClick={() => navigate('/events', { state: { selectedCategory: event.eventType } })}
												>
													{event.price === 0 ? 'Book' : `Book — ₹${event.price}`}
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
};

export default EventCard;
