import React from 'react';

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  priceFilter,
  setPriceFilter,
  dateFilter,
  setDateFilter,
  clearFilters,
}) => {
  return (
    <div className="filter-bar d-flex flex-wrap align-items-center justify-content-between p-3 rounded-3 shadow-sm mb-4">
      <div className="filter-group">
        <label htmlFor="search-input" className="me-2 text-muted d-none d-md-block">
          Search
        </label>
        <input
          type="text"
          id="search-input"
          className="form-control filter-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for events..."
        />
      </div>

      <div className="filter-group">
        <label htmlFor="category-select" className="me-2 text-muted d-none d-md-block">
          Category
        </label>
        <select
          id="category-select"
          className="form-select filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          <option value="Conference">Conference</option>
          <option value="Concert">Concert</option>
          <option value="Workshop">Workshop</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="price-select" className="me-2 text-muted d-none d-md-block">
          Price
        </label>
        <select
          id="price-select"
          className="form-select filter-select"
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
        >
          <option>All Prices</option>
          <option>Free</option>
          <option>Under ₹50</option>
          <option>₹51 - ₹100</option>
          <option>Over ₹100</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="date-input" className="me-2 text-muted d-none d-md-block">
          Date
        </label>
        <input
          type="date"
          id="date-input"
          className="form-control filter-input"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <button className="btn btn-secondary clear-button mt-3 mt-md-0" onClick={clearFilters}>
        Clear Filters
      </button>
    </div>
  );
};

export default FilterBar;
