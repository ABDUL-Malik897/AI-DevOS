import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";

import "./GoogleSuccess.css";

const GoogleSuccess = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();

    useEffect(() => {
        const hash = window.location.hash;
        const token = new URLSearchParams(hash.substring(1)).get("token");
        if (!token) {
            toast.error("Google authentication failed");
            navigate("/login");
            return;
        }

        API.get("/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            login({
                token,
                user: response.data.user
            });
            toast.success("Google login successful");
            navigate("/dashboard");
        }).catch((error) => {
            console.error("Google authentication failed:", error);
            toast.error(error.response?.data?.error || "Google authentication failed");
            navigate("/login");
        });
    }, [login, navigate,toast]);

    return (
        <div className="google-success-page">
            <div className="google-success-grid" />
            <div className="google-success-glow google-success-glow-one" />
            <div className="google-success-glow google-success-glow-two" />
            <div className="google-success-card">
                <div className="google-success-logo">
                    {">_"}
                </div>
                <div className="google-success-loader">
                    <div className="google-success-spinner" />
                </div>
                <div className="google-success-status">
                    <span />
                    AUTHENTICATION IN PROGRESS
                </div>
                <h1>
                    Signing you
                    <span> in...</span>
                </h1>
                <p>
                    Verifying your Google account and preparing your AI-DevOS workspace.
                </p>
                <div className="google-success-terminal">
                    <div className="terminal-top">
                        <div className="terminal-dots">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span>
                            AI-DEVOS / AUTH
                        </span>
                    </div>
                    <div className="terminal-body">
                        <div>
                            <span className="terminal-prefix">
                                &gt;
                            </span>{" "}
                            Authenticating Google identity...
                        </div>
                        <div>
                            <span className="terminal-prefix">
                                &gt;
                            </span>{" "}
                            Validating session token...
                        </div>
                        <div>
                            <span className="terminal-prefix success">
                                ✓
                            </span>{" "}
                            Preparing developer workspace...
                        </div>
                    </div>
                </div>
                <div className="google-success-footer">
                    <span>
                        AI<span>DevOS</span>
                    </span>
                    <span>
                        SECURE AUTHENTICATION
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GoogleSuccess;