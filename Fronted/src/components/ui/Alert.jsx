import React from "react";

const Alert = ({
  children,
  variant = "danger", // "danger" | "warning" | "success" | "info"
  className = "",
  action,
}) => {
  return (
    <div className={`alert alert--${variant} ${className}`} role="alert">
      <div style={{ flex: 1 }}>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default Alert;
