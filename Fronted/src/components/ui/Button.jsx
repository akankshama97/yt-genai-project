import React from "react";
import Spinner from "./Spinner";

const Button = ({
  children,
  variant = "primary", // "primary" | "secondary" | "ghost" | "danger-ghost"
  fullWidth = false,
  height44 = false,
  size = "md", // "sm" | "md"
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  "aria-label": ariaLabel,
  ...props
}) => {
  const classes = [
    "btn",
    `btn--${variant}`,
    size === "sm" ? "btn--sm" : "",
    fullWidth ? "btn--full-width" : "",
    height44 ? "btn--height-44" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

export default Button;
