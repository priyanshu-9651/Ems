import React from 'react';

const eventType = [
  { name: 'Music', icon: '🎵', count: 1 },
  { name: 'Food & Drink', icon: '🍔', count: 1 },
  { name: 'Technology', icon: '💻', count: 1 },
  { name: 'Arts & Culture', icon: '🎨', count: 1 },
  { name: 'Sports', icon: '🏅', count: 1 },
  { name: 'Business', icon: '💼', count: 1 },
];

const Categories = () => {
  return (
    <section className="py-5 bg-white">
      <div className="container text-center">
        <h3 className="h5 fw-semibold mb-4">Browse by Category</h3>
        <div className="row justify-content-center">
          {eventType.map((eventType, index) => (
            <div key={index} className="col-6 col-sm-4 col-md-2 mb-4">
              <div className="border rounded shadow-sm p-3 h-100 d-flex flex-column align-items-center justify-content-center">
                <div className="fs-2 mb-2">{eventType.icon}</div>
                <div className="fw-medium">{eventType.name}</div>
                <div className="text-muted small">{eventType.count} event</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
