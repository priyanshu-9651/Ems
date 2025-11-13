import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-3 mt-5">
      <div className="container">
        <div className="row text-center text-md-start">
          {/* Brand Info */}
          <div className="col-md-4 mb-4">
            <h5 className="text-uppercase">EventHub</h5>
            <p>Your one-stop destination for discovering and booking amazing events around you.</p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-4">
            <h6 className="text-uppercase">Quick Links</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#categoriesCategories" className="text-light text-decoration-none">
                  Categories
                </a>
              </li>
              <li>
                <a href="#admin" className="text-light text-decoration-none">
                  Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-4 mb-4">
            <h6 className="text-uppercase mb-3">Contact Us</h6>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
              <p className="mb-0">
                <strong>Email:</strong>{' '}
                <a href="mailto:support@eventhub.com" className="text-light text-decoration-none">
                  support@eventhub.com
                </a>
              </p>
              <p className="mb-0">
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p className="mb-0">
                <strong>Location:</strong> Coimbatore, TN
              </p>
            </div>
          </div>
        </div>

        <hr className="bg-light" />

        {/* Copyright */}
        <div className="text-center">
          <small>&copy; {new Date().getFullYear()} EventHub. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
