import React from "react";

const Spinner = ({ size = "md", className = "" }) => {
  return (
    <span
      className={`spinner ${size === "lg" ? "spinner--lg" : ""} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
