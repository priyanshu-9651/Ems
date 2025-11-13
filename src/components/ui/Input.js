import React from 'react';

const Input = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  icon,
  required = false,
  className = '',
}) => {
  const hasError = touched && error;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id || name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className={`input-with-icon ${hasError ? 'error' : ''}`}>
        
        <input
          id={id || name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`form-input ${className}`}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
      </div>

      {hasError && (
        <div id={`${name}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
