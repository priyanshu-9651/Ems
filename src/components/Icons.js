// Icon components
import React from 'react';

export const UserIcon = () => (
  <svg
    className="icon-start"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
export const MailIcon = () => (
  <svg
    className="icon-start"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
export const LockIcon = () => (
  <svg
    className="icon-start"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
export const EyeIcon = ({ isVisible = false }) => (
  <svg
    className="icon-end"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {isVisible ? (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </>
    )}
  </svg>
);
export const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M21.35 11.1h-9.2v2.8h5.3c-.2 1.9-1.6 3.7-3.6 3.7-2.2 0-4-1.8-4-4s1.8-4 4-4c1.1 0 2 .5 2.6 1l2.1-2.1C16.2 6.7 14.2 6 12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6c3.1 0 5.6-2.2 5.6-5.6 0-.4 0-.7-.1-1.1z"
    />
  </svg>
);
export const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M19.3 12.2C19.3 11 18.8 10 18.1 9.1c-.7-.9-1.6-1.5-2.9-1.5-1.5 0-2.8 1-3.6 1-.8 0-1.8-1-3.1-1-1.5 0-2.9.9-3.7 2.3-.8 1.4-1 3.3.2 5.4.8 1.9 1.7 3.4 2.9 3.4.4 0 1.2-.5 2.1-.5.9 0 1.5.5 2.1.5.6 0 1.3-.5 2.1-.5.9 0 1.6.5 2.1.5.8 0 1.7-1.3 2.5-3.1.5-1 .7-2 .7-2.9m-3.4-7.4c.5-.6.9-1.4 1.1-2.3-.9.1-1.9.7-2.6 1.5-.6.7-1.1 1.6-1.1 2.5.9 0 1.9-.6 2.6-1.7"
    />
  </svg>
);
export const CalendarIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
