import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import { useAuth } from "../hooks/useAuth";
import heroImage from "../../../assets/interview-hero.png";
import "../../../styles/auth.css";

const Login = () => {
  const { loading, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await handleLogin({ email, password });
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout fullBleed fluidNavbar>
      <div className="auth-split-layout">
        {/* Left Half (50% width on desktop, full width on mobile) */}
        <div className="auth-split-layout__left">
          <div className="auth-card-container">
            <Card className="auth-card" padding="lg">
              <div className="auth-header">
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your practice account</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                  required
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  height44
                  loading={submitting || loading}
                  disabled={submitting || loading}
                >
                  Sign in
                </Button>
              </form>

              <div className="auth-footer">
                Don't have an account? <Link to="/register">Create one</Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Half (50% width on desktop, hidden on smaller screens) */}
        <div className="auth-split-layout__right">
          <div className="auth-showcase">
            <img
              src={heroImage}
              alt="Candidate practicing technical interview"
              className="auth-showcase__image"
            />
            <div className="auth-showcase__overlay" />

            <div className="auth-showcase__content">
              <div className="auth-showcase__badge">
                <span className="auth-showcase__badge-dot" />
                <span>AI Interview Assessment</span>
              </div>

              <h2 className="auth-showcase__title">
                Master your next technical interview &amp; online assessment
              </h2>

              <p className="auth-showcase__description">
                Interactive coding environments, algorithmic challenges, and instant AI-driven feedback tailored for your dream engineering role.
              </p>

              <div className="auth-showcase__pills">
                <span className="auth-showcase__pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Real-time AI Feedback
                </span>
                <span className="auth-showcase__pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Curated DSA &amp; System Design
                </span>
                <span className="auth-showcase__pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Industry-Grade Scoring
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Login;
