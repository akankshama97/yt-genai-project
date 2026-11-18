import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import { useAuth } from "../hooks/useAuth";
import "../../../styles/auth.css";

const Register = () => {
  const { loading, handleRegister } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await handleRegister({ username, email, password });
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to register. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="auth-wrapper">
        <Card className="auth-card" padding="lg">
          <div className="auth-header">
            <h1 className="auth-title">Create an account</h1>
            <p className="auth-subtitle">Get started with role-specific interview prep</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              id="username"
              name="username"
              type="text"
              label="Full name"
              placeholder="Alex Johnson"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              autoComplete="name"
              required
            />

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
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
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
              Create account
            </Button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Register;
