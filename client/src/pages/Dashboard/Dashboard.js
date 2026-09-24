import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";
import { useToast } from "../../components/Toast/ToastContext";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const toast = useToast();

    const connectGithub = async () => {
        try {
            const response = await API.get("/github/connect");
            window.location.href = response.data.url;
        } catch (error) {
            console.error("GitHub connection failed:", error.response?.data || error.message);
            toast.error(error.response?.data?.error || "Failed to connect GitHub");
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-grid" />
            <div className="dashboard-glow dashboard-glow-one" />
            <div className="dashboard-glow dashboard-glow-two" />

            <header className="dashboard-navbar">
                <div
                    className="dashboard-brand"
                    onClick={() => navigate("/dashboard")}
                >
                    <div className="dashboard-brand-icon">
                        <span>{">_"}</span>
                    </div>

                    <div>
                        <div className="dashboard-brand-name">
                            AI<span>DevOS</span>
                        </div>

                        <div className="dashboard-brand-status">
                            AI DEVELOPMENT ENVIRONMENT
                        </div>
                    </div>
                </div>

                <div className="dashboard-navbar-actions">
                    <button
                        className="dashboard-nav-button"
                        onClick={() => navigate("/projects")}
                    >
                        Projects
                    </button>

                    <button
                        className="dashboard-logout"
                        onClick={() => {
                            logout();
                            navigate("/");
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-container">

                <section className="dashboard-welcome">
                    <div>
                        <div className="dashboard-eyebrow">
                            <span className="status-dot" />
                            WORKSPACE ONLINE
                        </div>

                        <h1>
                            Welcome back
                            <span>{user?.name ? `, ${user.name}` : ""}</span>
                        </h1>

                        <p>
                            Your AI-powered development workspace is ready.
                            Connect your repositories and start building.
                        </p>
                    </div>

                    <div className="dashboard-user-card">
                        <div className="dashboard-avatar">
                            {user?.name
                                ? user.name.charAt(0).toUpperCase()
                                : "U"}
                        </div>

                        <div>
                            <div className="user-card-name">
                                {user?.name || "Developer"}
                            </div>

                            <div className="user-card-email">
                                {user?.email || "Developer account"}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="dashboard-stats">
                    <div className="dashboard-stat-card">
                        <div className="stat-icon">{">_"}</div>

                        <div>
                            <div className="stat-value">AI</div>
                            <div className="stat-label">
                                Development Assistant
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-icon">◆</div>

                        <div>
                            <div className="stat-value">Git</div>
                            <div className="stat-label">
                                Repository Integration
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-icon">◉</div>

                        <div>
                            <div className="stat-value">Cloud</div>
                            <div className="stat-label">
                                Workspace Ready
                            </div>
                        </div>
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="section-heading">
                        <div>
                            <span className="section-kicker">
                                QUICK START
                            </span>

                            <h2>Start building</h2>

                            <p>
                                Choose where you want to go next.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-actions-grid">

                        <button
                            className="dashboard-action-card github-card"
                            onClick={connectGithub}
                        >
                            <div className="action-card-top">
                                <div className="action-icon github-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.16c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.18c0 .31.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                                        />
                                    </svg>
                                </div>

                                <span className="action-arrow">↗</span>
                            </div>

                            <div className="action-card-content">
                                <h3>Connect GitHub</h3>

                                <p>
                                    Connect your GitHub account and import repositories directly into AI-DevOS.
                                </p>
                            </div>

                            <div className="action-card-footer">
                                <span>AUTHENTICATE</span>
                                <span>→</span>
                            </div>
                        </button>

                        <button
                            className="dashboard-action-card"
                            onClick={() => navigate("/repositories")}
                        >
                            <div className="action-card-top">
                                <div className="action-icon">
                                    ▣
                                </div>

                                <span className="action-arrow">↗</span>
                            </div>

                            <div className="action-card-content">
                                <h3>Browse Repositories</h3>

                                <p>
                                    Explore your connected GitHub repositories and open a project workspace.
                                </p>
                            </div>

                            <div className="action-card-footer">
                                <span>EXPLORE CODE</span>
                                <span>→</span>
                            </div>
                        </button>

                        <button
                            className="dashboard-action-card"
                            onClick={() => navigate("/projects")}
                        >
                            <div className="action-card-top">
                                <div className="action-icon">
                                    ◈
                                </div>

                                <span className="action-arrow">↗</span>
                            </div>

                            <div className="action-card-content">
                                <h3>My Projects</h3>

                                <p>
                                    View your development projects and continue working from your AI-powered workspace.
                                </p>
                            </div>

                            <div className="action-card-footer">
                                <span>OPEN WORKSPACE</span>
                                <span>→</span>
                            </div>
                        </button>
                    </div>
                </section>

                <section className="dashboard-workspace-card">
                    <div className="workspace-copy">
                        <div className="section-kicker">
                            AI DEVOS ENGINE
                        </div>

                        <h2>
                            Your development
                            <span> command center.</span>
                        </h2>

                        <p>
                            Clone repositories, edit code, ask AI questions, run builds, review code, diagnose errors and manage your projects from a single environment.
                        </p>

                        <button
                            className="workspace-launch-button"
                            onClick={() => navigate("/projects")}
                        >
                            Open Projects
                            <span>→</span>
                        </button>
                    </div>

                    <div className="workspace-preview">
                        <div className="preview-header">
                            <div className="preview-dots">
                                <span />
                                <span />
                                <span />
                            </div>

                            <span>AI-DEVOS / WORKSPACE</span>
                        </div>

                        <div className="preview-body">
                            <div className="preview-sidebar">
                                <span className="preview-active">
                                    ▣ Explorer
                                </span>

                                <span>◈ Source</span>
                                <span>◉ Git</span>
                                <span>✦ AI</span>
                            </div>

                            <div className="preview-editor">
                                <div className="code-line">
                                    <span>01</span>
                                    <code>
                                        <b>const</b> workspace ={" "}
                                        <i>"AI-DevOS"</i>;
                                    </code>
                                </div>

                                <div className="code-line">
                                    <span>02</span>
                                    <code>
                                        workspace.<b>status</b> ={" "}
                                        <i>"ready"</i>;
                                    </code>
                                </div>

                                <div className="code-line">
                                    <span>03</span>
                                    <code>
                                        workspace.<b>ai</b>.assist();
                                    </code>
                                </div>

                                <div className="code-line">
                                    <span>04</span>
                                    <code />
                                </div>

                                <div className="terminal-line">
                                    <span>●</span> system ready
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="dashboard-footer">
                    <span>AI-DevOS</span>
                    <span>AI-POWERED DEVELOPMENT ENVIRONMENT</span>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;