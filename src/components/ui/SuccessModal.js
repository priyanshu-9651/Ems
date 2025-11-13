import React, { useEffect } from 'react';

export default function SuccessModal({ visible, message = 'Success', duration = 2300, onClose = () => {} }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)'
        }}
      />

      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 12,
          padding: '1.5rem 1.75rem',
          width: 360,
          maxWidth: '92%',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ width: 120, height: 120, margin: '0 auto 0.75rem' }}>
          <svg viewBox="0 0 120 120" width="120" height="120" style={{ display: 'block' }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e9f6ee" strokeWidth="10" />
            <circle
              className="sm-circle"
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#28a745"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="314"
              strokeDashoffset="314"
            />
            <path
              className="sm-check"
              d="M34 62 L53 80 L86 44"
              fill="none"
              stroke="#28a745"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="120"
              strokeDashoffset="120"
            />
          </svg>
        </div>

        <h5 style={{ margin: 0, fontSize: 18, color: '#1f2937' }}>{message}</h5>

        <style>{`
          .sm-circle { transform-origin: 60px 60px; animation: smDrawCircle 0.8s ease-out forwards; }
          .sm-check { animation: smDrawCheck 0.5s ease-out 0.75s forwards; }
          @keyframes smDrawCircle { to { stroke-dashoffset: 0; } }
          @keyframes smDrawCheck { to { stroke-dashoffset: 0; } }
        `}</style>
      </div>
    </div>
  );
}
