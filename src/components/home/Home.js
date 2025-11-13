import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from '../ui/Slider';
import { Calendar, Music, Landmark, Users } from 'lucide-react';
import TestimonialSection from './TestimonialSection';

const iconData = [
  { Icon: Calendar, label: 'All Events', category: 'All Categories', color: 'text-primary', hover: 'hover-bg-primary' },
  { Icon: Music, label: 'Concerts', category: 'Concert', color: 'text-danger', hover: 'hover-bg-danger' },
  { Icon: Landmark, label: 'Conferences', category: 'Conference', color: 'text-success', hover: 'hover-bg-success' },
  { Icon: Users, label: 'Workshops', category: 'Workshop', color: 'text-warning', hover: 'hover-bg-warning' },
];

const BaseHome = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCategoryClick = (category) => {
    navigate('/EventsPage', { state: { selectedCategory: category } });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate('/EventsPage', { state: { searchQuery: searchTerm } });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <Slider />
      <section className="p-5 text-center bg-light animate__animated animate__fadeIn">
        <h2 className="text-4xl font-bold mb-4 gradient-text">Discover Amazing Events Near You</h2>
        <p className="text-lg mb-6">
          From concerts to conferences, find and book tickets for the best events in your city.
        </p>
        {/* Lucide Icons Row with micro-interactions */}
        <div className="container mb-4">
          <div className="row justify-content-center g-4">
            {iconData.map(({ Icon, label, category, color }, idx) => (
              <div
                key={label}
                className={`col-6 col-md-3`}
              >
                <div
                  className={`bg-white rounded shadow-sm py-4 d-flex flex-column align-items-center icon-card ${hovered === idx ? 'icon-card-hover' : ''}`}
                  style={{
                    transition: 'box-shadow 0.3s, transform 0.3s, background 0.3s',
                    boxShadow: hovered === idx ? '0 8px 32px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.07)',
                    transform: hovered === idx ? 'translateY(-8px) scale(1.05)' : 'none',
                    background: hovered === idx ? 'linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%)' : '#fff',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleCategoryClick(category)}
                >
                  <Icon size={40} className={`mb-2 ${color} icon-animate`} style={{ transition: 'color 0.3s, transform 0.3s', transform: hovered === idx ? 'scale(1.2) rotate(-8deg)' : 'scale(1)' }} />
                  <span className="fw-semibold fs-5" style={{ letterSpacing: '0.5px' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      
        <div className="container mt-5">
          {/* Search Input */}
          <div className="row justify-content-center mb-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control rounded-pill shadow-sm search-input"
                placeholder="Search events, venues or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ transition: 'box-shadow 0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                onFocus={e => e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'}
                onBlur={e => e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
              />
            </div>
          </div>
          {/* Search Button */}
          <div className="row justify-content-center">
            <div className="col-md-2 text-center">
              <button
                className="btn btn-dark rounded-pill w-100 shadow-sm search-btn"
                type="button"
                onClick={handleSearch}
                style={{ transition: 'background 0.3s, transform 0.2s', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Search Events
              </button>
            </div>
          </div>
        </div>
      </section>
      <style>{`
        .gradient-text {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        .icon-card {
          transition: box-shadow 0.3s, transform 0.3s, background 0.3s;
        }
        .icon-card-hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          background: linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%) !important;
        }
        .icon-animate {
          transition: color 0.3s, transform 0.3s;
        }
        .search-input:focus {
          box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
        }
        .search-btn:active {
          transform: scale(0.96);
        }
      `}</style>
        
    </div>
  );
};

export default BaseHome;
