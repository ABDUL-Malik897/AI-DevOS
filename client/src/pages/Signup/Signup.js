import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";
import "./Signup.css";

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await API.post("/auth/signup", {
                name,
                email,
                password
            });
            login(response.data);
            toast.success("Account created successfully");
            navigate("/dashboard");
        } catch (error) {
            setError(error.response?.data?.error || "Unable to create your account.");
            toast.error(error.response?.data?.error || "Unable to create your account.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href =  "http://localhost:5000/api/auth/google";
    };

    return (
        <main className="auth-page">
            <div className="auth-background-glow auth-glow-one" />
            <div className="auth-background-glow auth-glow-two" />
            <div className="auth-page-grid" />
            <section className="auth-shell signup-shell">
                <div className="auth-showcase signup-showcase">
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
                            START YOUR JOURNEY
                        </span>
                        <h1>
                            Build.
                            <br />
                            <span>Experiment.</span>
                            <br />
                            Ship.
                        </h1>
                        <p>
                            Create your AI-DevOS account and bring your entire development workflow into one intelligent workspace.
                        </p>
                        <div className="auth-feature-list">
                            <div className="auth-feature">
                                <div>✦</div>
                                <span>
                                    AI-assisted coding
                                </span>
                            </div>
                            <div className="auth-feature">
                                <div>⌁</div>
                                <span>
                                    Smart project workflows
                                </span>
                            </div>
                            <div className="auth-feature">
                                <div>↗</div>
                                <span>
                                    Build and ship faster
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="auth-showcase-footer">
                        <span>
                            DEVELOP WITHOUT LIMITS
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
                                CREATE ACCOUNT
                            </span>
                            <h2>
                                Start building
                            </h2>
                            <p>
                                Create your AI-DevOS workspace in a few seconds.
                            </p>
                        </div>
                        <form
                            className="auth-form"
                            onSubmit={handleSignup}
                        >
                            <div className="auth-field">
                                <label htmlFor="signup-name">
                                    Name
                                </label>
                                <div className="auth-input-wrapper">
                                    <span className="auth-input-icon">
                                        ◆
                                    </span>
                                    <input
                                        id="signup-name"
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="auth-field">
                                <label htmlFor="signup-email">
                                    Email
                                </label>
                                <div className="auth-input-wrapper">
                                    <span className="auth-input-icon">
                                        @
                                    </span>
                                    <input
                                        id="signup-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="auth-field">
                                <label htmlFor="signup-password">
                                    Password
                                </label>
                                <div className="auth-input-wrapper">
                                    <span className="auth-input-icon">
                                        *
                                    </span>
                                    <input
                                        id="signup-password"
                                        type="password"
                                        placeholder="Create a password"
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
                                    ? "Creating account..."
                                    : "Create Account"}
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
                            onClick={handleGoogleSignup}
                        >
                            <span className="google-logo">
                                G
                            </span>
                            <span>
                                Continue with Google
                            </span>
                        </button>
                        <p className="auth-switch">
                            Already have an account?
                            <Link to="/login">
                                Sign in
                            </Link>
                        </p>
                    </div>
                    <p className="auth-security">
                        <span>●</span>
                        Your account is securely protected
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Signup;