import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import Button from "../ui/Button";

const Navbar = ({ fluid = false }) => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = user?.username || user?.name || "Akanksha Maurya";

  const getInitials = (name) => {
    if (!name) return "AM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  return (
    <header className="navbar" role="banner">
      <div className={`navbar__container ${fluid ? "navbar__container--fluid" : ""}`}>
        <Link to="/" className="navbar__brand" aria-label="InterviewPrep Home">
          <span className="navbar__brand-dot" aria-hidden="true" />
          <span>InterviewPrep</span>
        </Link>

        <nav className="navbar__nav" aria-label="Main navigation">
          {user ? (
            <>
              <Link to="/" className="navbar__link">
                Practice
              </Link>
              <div className="navbar__user-profile">
                <span className="navbar__avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="navbar__user-name" title={displayName}>
                  {displayName}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link">
                Sign in
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
