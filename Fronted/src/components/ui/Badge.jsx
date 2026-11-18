import React from "react";

const Badge = ({
  children,
  variant = "neutral", // "primary" | "success" | "warning" | "danger" | "neutral"
  className = "",
  ...props
}) => {
  return (
    <span className={`badge badge--${variant} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
