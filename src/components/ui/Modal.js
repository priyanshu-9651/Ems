import React from 'react';

const Modal = ({ isOpen, title, onClose, children, hideHeader = false }) => {
  if (!isOpen) return null;

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050,
    padding: '1rem',
    background: 'rgba(0,0,0,0.18)',
    WebkitBackdropFilter: 'blur(6px) saturate(120%)',
    backdropFilter: 'blur(6px) saturate(120%)'
  };

  const windowStyle = {
    position: 'relative',
    zIndex: 2,
    background: '#fff',
    borderRadius: 10,
    width: '100%',
    maxWidth: 560,
    boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid #eee'
  };

  const bodyStyle = {
    padding: '1rem',
    overflowY: 'auto'
  };

  return (
    <div style={backdropStyle}>
      <div style={windowStyle} role="dialog" aria-modal="true">
        {!hideHeader && (
          <div style={headerStyle}>
            <div style={{ fontWeight: 600 }}>{title}</div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
        )}
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
