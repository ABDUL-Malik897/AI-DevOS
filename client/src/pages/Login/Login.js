import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await API.post("/auth/login", {
                email,
                password
            });
            login(response.data);
            toast.success("Logged in successfully");
            navigate("/dashboard");
        } catch (error) {
            const message = error.response?.data?.error || "Unable to login. Please check your credentials.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    return (
        <main className="auth-page">
            <div className="auth-background-glow auth-glow-one" />
            <div className="auth-background-glow auth-glow-two" />
            <div className="auth-page-grid" />
            <section className="auth-shell">
                <div className="auth-showcase">
                    <Link
                        to="/"
                        className="auth-brand"
                    >
                        <div className="auth-brand-mark">
                            <span>A</span>
                            <small>&lt;/&gt;</small>
                        </div>
                        <div>
                            <strong>
                                AI-Dev<span>OS</span>
                            </strong>
                            <p>
                                Code • Build • Ship • Smarter
                            </p>
                        </div>
                    </Link>
                    <div className="auth-showcase-content">
                        <span className="auth-eyebrow">
                            WELCOME BACK, DEVELOPER
                        </span>
                        <h1>
                            Your code.
                            <br />
                            <span>Your workspace.</span>
                            <br />
                            Your AI.
                        </h1>
                        <p>
                            Continue building with AI-DevOS — an intelligent development environment designed to keep your entire workflow in one place.
                        </p>
                        <div className="auth-feature-list">
                            <div className="auth-feature">
                                <div>✦</div>
                                <span>
                                    AI-assisted development
                                </span>
                            </div>
                            <div className="auth-feature">
                                <div>⌘</div>
                                <span>
                                    Browser-based workspace
                                </span>
                            </div>
                            <div className="auth-feature">
                                <div>✓</div>
                                <span>
                                    Build, review and debug
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="auth-showcase-footer">
                        <span>
                            AI-POWERED DEVELOPMENT
                        </span>
                        <div className="auth-footer-line" />
                    </div>
                </div>
                <div className="auth-card-wrapper">
                    <div className="auth-card">
                        <div className="auth-card-glow" />
                        <div className="auth-card-header">
                            <span className="auth-card-badge">
                                <span />
                                SECURE ACCESS
                            </span>
                            <h2>
                                Welcome back
                            </h2>
                            <p>
                                Sign in to your AI-powered development workspace.
                            </p>
                        </div>
                        <form
                            className="auth-form"
                            onSubmit={handleLogin}
                        >
                            <div className="auth-field">
                                <label htmlFor="login-email">
                                    Email
                                </label>
                                <div className="auth-input-wrapper">
                                    <span className="auth-input-icon">
                                        @
                                    </span>
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="auth-field">
                                <div className="auth-label-row">
                                    <label htmlFor="login-password">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        className="forgot-link"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="auth-input-wrapper">
                                    <span className="auth-input-icon">
                                        *
                                    </span>
                                    <input
                                        id="login-password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="auth-error">
                                    <span>!</span>
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="auth-primary-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing in..."
                                    : "Sign In"}
                                <span>
                                    →
                                </span>
                            </button>
                        </form>
                        <div className="auth-divider">
                            <span />
                            <p>OR CONTINUE WITH</p>
                            <span />
                        </div>
                        <button
                            type="button"
                            className="google-login-component"
                            onClick={handleGoogleLogin}
                        >
                            <span className="google-logo">
                                G
                            </span>
                            <span>
                                Continue with Google
                            </span>
                        </button>
                        <p className="auth-switch">
                            Don't have an account?
                            <Link to="/signup">
                                Create one
                            </Link>
                        </p>
                    </div>
                    <p className="auth-security">
                        <span>●</span>
                        Your connection is protected
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Login;