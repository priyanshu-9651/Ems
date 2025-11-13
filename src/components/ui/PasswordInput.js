import React, { useState } from 'react';
import { LockIcon, EyeIcon } from '../Icons';

const PasswordInput = ({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = touched && error;

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

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
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`form-input ${className}`}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="password-toggle"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          <EyeIcon isVisible={showPassword} />
        </button>
      </div>

      {hasError && (
        <div id={`${name}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
