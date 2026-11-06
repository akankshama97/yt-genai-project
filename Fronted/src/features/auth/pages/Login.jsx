import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../auth.form.scss";
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const { loading, handleLogin } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim() || !password.trim()) {
            setError("Please enter both email and password.");
            return;
        }
        try {
            await handleLogin({ email, password });
            navigate('/');
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Invalid email or password.");
        }
    };

    if (loading) {
        return (
            <main>
                <h1>Loading...</h1>
            </main>
        );
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                {error && <p className="error-message" style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email address"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" className="button primary-button">
                        Login
                    </button>
                </form>

                <p>
                    Don't have an account? <Link to={"/register"}>Register</Link>
                </p>
            </div>
        </main>
    );
};

export default Login;