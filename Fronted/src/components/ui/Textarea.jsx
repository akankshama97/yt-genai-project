import React from "react";

const Textarea = ({
  id,
  name,
  label,
  statusText, // e.g. "Required" or "Optional"
  helperText,
  error,
  rows = 5,
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
  ...props
}) => {
  return (
    <div className={`form-field ${className}`}>
      {(label || statusText) && (
        <div className="form-field__header">
          {label && (
            <label htmlFor={id} className="form-field__label">
              {label}
            </label>
          )}
          {statusText && (
            <span className="form-field__status">{statusText}</span>
          )}
        </div>
      )}

      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel || label}
        aria-invalid={Boolean(error)}
        className={`form-field__textarea ${error ? "form-field__textarea--error" : ""}`}
        {...props}
      />

      {error ? (
        <p className="form-field__error-text" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="form-field__helper">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Textarea;
