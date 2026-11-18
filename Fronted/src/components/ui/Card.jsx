import React from "react";

const Card = ({
  children,
  className = "",
  padding = "default", // "default" (24px) | "sm" (16px) | "lg" (32px)
  muted = false,
  as: Component = "div",
  ...props
}) => {
  const paddingClass =
    padding === "sm" ? "card--p-16" : padding === "lg" ? "card--p-32" : "";

  return (
    <Component
      className={`card ${paddingClass} ${muted ? "card--muted" : ""} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
