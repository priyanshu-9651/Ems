import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllEventsForAdmin,
  getAllOngoingEventsForAdmin,
  getTotalEventCountForAdmin,
  getAllBookingsForAdmin,
} from "../../services/eventService";
import { getAllEventRevenue } from "../../services/authService";
import { clearAuthData } from "../../utils/jwt";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    ongoingEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get total events count
      const countResponse = await getTotalEventCountForAdmin();
      if (countResponse.success) {
        setStats((prev) => ({ ...prev, totalEvents: countResponse.data }));
      }

      // Get ongoing events
      const ongoingResponse = await getAllOngoingEventsForAdmin();
      if (ongoingResponse.success) {
        const ongoingEvents = Array.isArray(ongoingResponse.data) ? ongoingResponse.data : [];
        setStats((prev) => ({
          ...prev,
          ongoingEvents: ongoingEvents.length,
        }));
      }

      // Get all events for upcoming display
      const eventsResponse = await getAllEventsForAdmin();
      if (eventsResponse.success) {
        const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
        const upcoming = events
          .filter((event) => new Date(event.eventStartDate) > new Date())
          .sort((a, b) => new Date(a.eventStartDate) - new Date(b.eventStartDate))
          .slice(0, 5);
        setUpcomingEvents(upcoming);
      }

      // Get all bookings for stats
      const bookingsResponse = await getAllBookingsForAdmin();
      if (bookingsResponse.success) {
        const bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
        
        // Debug: Log booking structure
        console.log('Bookings data:', bookings.length > 0 ? bookings[0] : 'No bookings');
        
        setStats((prev) => ({
          ...prev,
          totalBookings: bookings.length,
        }));

        // Get recent bookings (last 5)
        const recent = bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(booking => ({
            id: booking.bookingId,
            eventName: booking.event?.eventName || 'Unknown Event',
            customerName: booking.customer?.user?.fullName || 'Unknown',
            amount: booking.totalAmount || 0,
            time: booking.createdAt,
          }));
        setRecentBookings(recent);
      }

      // Get revenue from dedicated revenue API
      const revenueResponse = await getAllEventRevenue();
      console.log('=== REVENUE API DEBUG ===');
      console.log('Revenue API response:', revenueResponse);
      console.log('Revenue API success:', revenueResponse.success);
      console.log('Revenue API status:', revenueResponse.status);
      console.log('Revenue API error:', revenueResponse.error);
      
      if (revenueResponse.success) {
        const revenueData = Array.isArray(revenueResponse.data) ? revenueResponse.data : [];
        console.log('Revenue data array length:', revenueData.length);
        console.log('Revenue data:', JSON.stringify(revenueData, null, 2));
        
        const totalRevenue = revenueData.reduce((sum, item) => {
          console.log(`Processing event: ${item.eventName}, revenue: ${item.totalRevenue}`);
          return sum + (item.totalRevenue || 0);
        }, 0);
        
        console.log('Calculated total revenue:', totalRevenue);
        console.log('=== END REVENUE DEBUG ===');
        
        setStats((prev) => ({
          ...prev,
          totalRevenue: totalRevenue,
        }));
      } else {
        console.error('Revenue API FAILED:', revenueResponse.error);
        console.log('=== END REVENUE DEBUG ===');
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">Admin Dashboard</h1>
          <p className="text-muted">
            Welcome back! Here's an overview of all events and bookings.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate("/admin/events")}
          >
            <i className="bi bi-calendar-event"></i> All Events
          </button>
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => navigate("/admin/revenue")}
          >
            <i className="bi bi-cash-stack"></i> Revenue
          </button>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => navigate("/admin/users")}
          >
            <i className="bi bi-people"></i> Users
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/admin/settings")}
          >
            <i className="bi bi-person"></i>
          </button>
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={() => navigate("/admin/settings")}
          >
            <i className="bi bi-gear"></i>
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => {
              clearAuthData();
              window.location.href = "/";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Events</h6>
              <h3 className="mb-0">{stats.totalEvents}</h3>
              <small className="text-muted">Across all organizers</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Ongoing Events</h6>
              <h3 className="mb-0">{stats.ongoingEvents}</h3>
              <small className="text-muted">Currently active</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Bookings</h6>
              <h3 className="mb-0">{stats.totalBookings}</h3>
              <small className="text-muted">All time bookings</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Total Revenue</h6>
              <h3 className="mb-0">Rs. {stats.totalRevenue.toLocaleString()}</h3>
              <small>Platform revenue</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="row mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent Bookings</span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate("/admin/revenue")}
              >
                View All
              </button>
            </div>
            <div
              className="card-body"
              style={{ maxHeight: "350px", overflowY: "auto" }}
            >
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="mb-1 fw-semibold">{booking.eventName}</p>
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          {booking.customerName}
                        </small>
                      </div>
                      <div className="text-end">
                        <p className="mb-0 fw-bold text-success">
                          Rs. {booking.amount.toFixed(2)}
                        </p>
                        <small className="text-muted">
                          {new Date(booking.time).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  No recent bookings
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Upcoming Events</span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate("/admin/events")}
              >
                View All
              </button>
            </div>
            <div
              className="card-body"
              style={{ maxHeight: "350px", overflowY: "auto" }}
            >
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom"
                  >
                    <div>
                      <p className="mb-0 fw-bold">{event.eventName}</p>
                      <small className="text-muted">
                        {new Date(event.eventStartDate).toLocaleDateString()}
                        {event.eventLocation && ` • ${event.eventLocation}`}
                      </small>
                    </div>
                    <span
                      className={`badge ${
                        event.eventStatus === "UPCOMING"
                          ? "bg-success"
                          : event.eventStatus === "DRAFT"
                          ? "bg-secondary"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {event.eventStatus}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                  No upcoming events
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-lg-12">
          <div className="card shadow-sm">
            <div className="card-header">Quick Actions</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => navigate("/admin/events")}
                  >
                    <i className="bi bi-calendar-event d-block fs-3 mb-2"></i>
                    Manage Events
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-success w-100"
                    onClick={() => navigate("/admin/users")}
                  >
                    <i className="bi bi-people d-block fs-3 mb-2"></i>
                    Manage Users
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-info w-100"
                    onClick={() => navigate("/admin/revenue")}
                  >
                    <i className="bi bi-cash-stack d-block fs-3 mb-2"></i>
                    View Revenue
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-dark w-100"
                    onClick={() => navigate("/admin/settings")}
                  >
                    <i className="bi bi-gear d-block fs-3 mb-2"></i>
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
