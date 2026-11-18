import Navbar from "./Navbar";

const AppLayout = ({ children, fullBleed = false, fluidNavbar = false, className = "" }) => {
  return (
    <div className={`app-shell ${className}`}>
      <Navbar fluid={fluidNavbar} />
      {fullBleed ? (
        <main className="page-container--full-bleed">{children}</main>
      ) : (
        <main className="page-container">{children}</main>
      )}
    </div>
  );
};

export default AppLayout;
