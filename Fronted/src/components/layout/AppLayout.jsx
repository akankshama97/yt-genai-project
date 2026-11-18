import React from "react";
import Navbar from "./Navbar";

const AppLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-container">{children}</main>
    </div>
  );
};

export default AppLayout;
