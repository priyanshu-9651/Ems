import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEventCountForOrganizer,
  getOngoingEventsForOrganizer,
  getEventsForOrganizer,
} from "../../services/eventService";
import { clearAuthData } from "../../utils/jwt";

export function EventOrganizerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    ongoingEvents: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get total events count
        const countResponse = await getEventCountForOrganizer();
        if (countResponse.success) {
          setStats((prev) => ({ ...prev, totalEvents: countResponse.data }));
        }

        // Get ongoing events
        const ongoingResponse = await getOngoingEventsForOrganizer();
        if (ongoingResponse.success) {
          setStats((prev) => ({
            ...prev,
            ongoingEvents: ongoingResponse.data.length,
          }));
        }

        // Get all events for upcoming
        const eventsResponse = await getEventsForOrganizer();
        if (eventsResponse.success) {
          const events = eventsResponse.data;
          const upcoming = events
            .filter((event) => new Date(event.eventStartDate) > new Date())
            .slice(0, 3);
          setUpcomingEvents(upcoming);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const recentActivities = [
    {
      id: "1",
      message: "Summer Music Festival registration opened",
      time: "2 hours ago",
    },
    {
      id: "2",
      message: "Venue booking task completed by Sarah",
      time: "4 hours ago",
    },
    {
      id: "3",
      message: "Payment received: Rs. 5,000 for Tech Summit",
      time: "6 hours ago",
    },
    {
      id: "4",
      message: "Art Exhibition published successfully",
      time: "1 day ago",
    },
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">Dashboard</h1>
          <p className="text-muted">
            Welcome back! Here's what's happening with your events.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate("/organizer/tasks")}
          >
            + Add Task
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/organizer/create-event")}
          >
            + Create Event
          </button>
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => navigate("/organizer/bookings")}
          >
            <i className="bi bi-clipboard-check"></i> View Bookings
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/organizer/settings")}
          >
            <i className="bi bi-person"></i>
          </button>
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={() => navigate("/organizer/settings")}
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

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Total Events</h6>
              <h3>{stats.totalEvents}</h3>
              <small className="text-muted">Events created</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Ongoing Events</h6>
              <h3>{stats.ongoingEvents}</h3>
              <small className="text-muted">Currently active</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Pending Tasks</h6>
              <h3>0</h3>
              <small className="text-muted">Tasks to complete</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Recent Activity</div>
            <div
              className="card-body"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {recentActivities.map((activity) => (
                <div key={activity.id} className="mb-3">
                  <p className="mb-1">{activity.message}</p>
                  <small className="text-muted">{activity.time}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Upcoming Events</span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate("/organizer/events")}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {upcomingEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="d-flex justify-content-between align-items-center mb-3"
                >
                  <div>
                    <p className="mb-0 fw-bold">{event.eventName}</p>
                    <small className="text-muted">
                      {new Date(event.eventStartDate).toLocaleDateString()}
                    </small>
                  </div>
                  <span className="badge bg-primary">{event.eventStatus}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Task Summary</span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate("/organizer/tasks")}
              >
                Manage Tasks
              </button>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Pending</span>
                <span className="badge bg-danger">0</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>In Progress</span>
                <span className="badge bg-secondary">0</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Completed</span>
                <span className="badge bg-success">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
