import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../utils/jwt';
import { getAllOrganizers, updateUserStatus } from '../../services/authService';

function AdminUserManagement() {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name'); // 'name' or 'id'
  const [statusFilter, setStatusFilter] = useState(''); // 'ACTIVE', 'DISABLED', ''
  const [updatingStatus, setUpdatingStatus] = useState(null); // userId being updated

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Using the new API function from authService
      const response = await getAllOrganizers();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch organizers');
      }

      setOrganizers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError(err.message || 'Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  const updateOrganizerStatus = async (userId, newStatus) => {
    try {
      setUpdatingStatus(userId);

      // Using the new API function from authService
      const response = await updateUserStatus(userId, newStatus);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update organizer status');
      }

      // Update the local state
      setOrganizers(prevOrganizers =>
        prevOrganizers.map(org =>
          org.userId === userId ? { ...org, status: response.data.status } : org
        )
      );

      alert(`Organizer status updated to ${newStatus} successfully!`);
    } catch (err) {
      console.error('Error updating organizer status:', err);
      alert(err.message || 'Failed to update organizer status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusChange = (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const confirmMessage = `Are you sure you want to ${newStatus === 'ACTIVE' ? 'enable' : 'disable'} this organizer?`;
    
    if (window.confirm(confirmMessage)) {
      updateOrganizerStatus(userId, newStatus);
    }
  };

  const handleSignOut = () => {
    clearAuthData();
    window.location.href = '/';
  };

  const filteredOrganizers = organizers.filter((organizer) => {
    const term = searchTerm.toLowerCase();
    
    // Search filter
    let matchesSearch = true;
    if (searchBy === 'name') {
      matchesSearch = searchTerm === '' || 
        (organizer.fullName && organizer.fullName.toLowerCase().includes(term));
    } else if (searchBy === 'id') {
      matchesSearch = searchTerm === '' || 
        (organizer.userId && organizer.userId.toString().includes(searchTerm));
    }
    
    // Status filter
    const matchesStatus = statusFilter === '' || organizer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading organizers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchOrganizers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h3 mb-1">Event Organizer Management</h1>
          <p className="text-muted mb-0">Manage all event organizers and their status</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/dashboard')}
          >
            <i className="bi bi-house"></i> Dashboard
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/events')}
          >
            <i className="bi bi-calendar-event"></i> Events
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/revenue')}
          >
            <i className="bi bi-cash-stack"></i> Revenue
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/settings')}
          >
            <i className="bi bi-gear"></i>
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Organizers</h6>
              <h3 className="mb-0">{organizers.length}</h3>
              <small className="text-muted">Registered users</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Active Organizers</h6>
              <h3 className="mb-0">{organizers.filter(o => o.status === 'ACTIVE').length}</h3>
              <small className="text-success">Currently active</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Disabled Organizers</h6>
              <h3 className="mb-0">{organizers.filter(o => o.status === 'DISABLED').length}</h3>
              <small className="text-danger">Currently disabled</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-muted">Filtered Results</h6>
              <h3 className="mb-0">{filteredOrganizers.length}</h3>
              <small className="text-muted">Matching criteria</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Search</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={searchBy === 'name' ? 'Search by organizer name...' : 'Search by organizer ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchBy(searchBy === 'name' ? 'id' : 'name')}
                  title={`Currently searching by ${searchBy}. Click to switch.`}
                >
                  <i className={`bi ${searchBy === 'name' ? 'bi-hash' : 'bi-person'}`}></i>
                  {searchBy === 'name' ? ' ID' : ' Name'}
                </button>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setSearchBy('name');
                }}
              >
                <i className="bi bi-arrow-clockwise"></i> Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Organizers Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizers.map((organizer) => (
                  <tr key={organizer.userId}>
                    <td>
                      <span className="badge bg-secondary">#{organizer.userId}</span>
                    </td>
                    <td>
                      <div className="fw-semibold">
                        <i className="bi bi-person-badge me-2"></i>
                        {organizer.fullName || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        <i className="bi bi-envelope me-1"></i>
                        {organizer.email || 'N/A'}
                      </small>
                    </td>
                    <td>
                      <small className="text-muted">
                        <i className="bi bi-telephone me-1"></i>
                        {organizer.phone || 'N/A'}
                      </small>
                    </td>
                    <td>
                      <span 
                        className={`badge ${
                          organizer.status === 'ACTIVE' 
                            ? 'bg-success' 
                            : 'bg-danger'
                        }`}
                      >
                        {organizer.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {organizer.createdAt 
                          ? new Date(organizer.createdAt).toLocaleDateString() 
                          : 'N/A'}
                      </small>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${
                          organizer.status === 'ACTIVE' 
                            ? 'btn-warning' 
                            : 'btn-success'
                        }`}
                        onClick={() => handleStatusChange(organizer.userId, organizer.status)}
                        disabled={updatingStatus === organizer.userId}
                      >
                        {updatingStatus === organizer.userId ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className={`bi ${
                              organizer.status === 'ACTIVE' 
                                ? 'bi-x-circle' 
                                : 'bi-check-circle'
                            } me-1`}></i>
                            {organizer.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrganizers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No organizers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;
