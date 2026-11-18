import React from "react";

const ProgressBar = ({
  value = 0, // 0 to 100
  max = 100,
  variant = "primary", // "primary" | "success" | "warning" | "danger"
  label,
  valueText,
  className = "",
  ariaLabel,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`progress-bar-wrap ${className}`}>
      {(label || valueText) && (
        <div className="form-field__header">
          {label && <span className="form-field__label">{label}</span>}
          {valueText && (
            <span className="form-field__status">{valueText}</span>
          )}
        </div>
      )}
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || label}
      >
        <div
          className={`progress-bar__fill progress-bar__fill--${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
