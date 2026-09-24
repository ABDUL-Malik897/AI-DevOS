import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useToast } from "../../components/Toast/ToastContext";
import "./Projects.css";

const PROJECTS_PER_PAGE = 12;

const Projects = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [initializingProject, setInitializingProject] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalProjects: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await API.get("/projects", {
                    params: {
                        page,
                        per_page: PROJECTS_PER_PAGE,
                        search: debouncedSearch
                    }
                });
                setProjects(response.data.projects || []);
                setPagination(response.data.pagination || {
                    totalProjects: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: page > 1
                });
            } catch (error) {
                const message = error.response?.data?.error || "Failed to load projects";
                setError(message);
                setProjects([]);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [page, debouncedSearch, toast]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 2000);
        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    const initializeProject = async (projectId) => {
        try {
            setInitializingProject(projectId);
            await API.post(`/projects/${projectId}/clone`);
            toast.success("Repository cloned successfully");
        } catch (error) {
            const message = error.response?.data?.error || "Failed to clone repository";
            setError(message);
            toast.error(message);
        } finally {
            setInitializingProject(null);
        }
    };

    const goToPreviousPage = () => {
        if (!pagination.hasPreviousPage) {
            return;
        }
        setPage((currentPage) => Math.max(1, currentPage - 1)
        );
    };

    const goToNextPage = () => {
        if (!pagination.hasNextPage) {
            return;
        }
        setPage((currentPage) => currentPage + 1);
    };

    if (loading) {
        return (
            <div className="projects-page">
                <div className="projects-grid-bg" />
                <div className="projects-loading">
                    <div className="loading-orb" />
                    <div className="loading-text">
                        <span>INITIALIZING</span>
                        <h2>
                            Loading projects...
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="projects-page">
            <div className="projects-grid-bg" />
            <div className="projects-glow projects-glow-one" />
            <div className="projects-glow projects-glow-two" />
            <header className="projects-navbar">
                <div
                    className="projects-brand"
                    onClick={() => navigate("/dashboard")}
                >
                    <div className="projects-brand-icon">
                        <span>{">_"}</span>
                    </div>
                    <div>
                        <div className="projects-brand-name">
                            AI<span>DevOS</span>
                        </div>
                        <div className="projects-brand-status">
                            PROJECT CONTROL CENTER
                        </div>
                    </div>
                </div>
                <div className="projects-nav-actions">
                    <button
                        className="projects-nav-button"
                        onClick={() => navigate("/dashboard")}
                    >
                        Dashboard
                    </button>
                    <button
                        className="projects-add-button"
                        onClick={() => navigate("/repositories")}
                    >
                        <span>+</span>
                        Add Repository
                    </button>
                </div>
            </header>

            <main className="projects-container">
                <section className="projects-header">
                    <div>
                        <div className="projects-eyebrow">
                            <span className="projects-status-dot" />
                            PROJECT WORKSPACE
                        </div>
                        <h1>
                            My <span>Projects</span>
                        </h1>
                        <p>
                            Manage your connected repositories and open development workspaces from one place.
                        </p>
                    </div>
                    <div className="projects-count-card">
                        <span className="projects-count">
                            {pagination.totalProjects}
                        </span>
                        <span className="projects-count-label">
                            {pagination.totalProjects === 1 ? "PROJECT" : "PROJECTS"}
                        </span>
                    </div>
                </section>
                {error && (
                    <div className="projects-error">
                        <span>!</span>
                        {error}
                    </div>
                )}
                {projects.length === 0 ? (
                    <section className="projects-empty">
                        <div className="empty-icon">
                            ◈
                        </div>
                        <div className="empty-content">
                            <div className="empty-kicker">
                                WORKSPACE EMPTY
                            </div>
                            <h2>
                                No projects yet
                            </h2>
                            <p>
                                Connect a GitHub repository to create your first AI-DevOS project.
                            </p>
                            <button
                                className="empty-button"
                                onClick={() => navigate("/repositories")}
                            >
                                <span>+</span>
                                Add GitHub Repository
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="projects-section">
                        <div className="projects-search">
                            <span className="projects-search-icon">
                                ⌕
                            </span>

                            <input
                                type="text"
                                value={search}
                                placeholder="Search projects..."
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />

                            {search && (
                                <button
                                    className="projects-search-clear"
                                    onClick={() => {
                                        setSearch("");
                                        setPage(1);
                                    }}
                                    aria-label="Clear project search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        <div className="projects-section-heading">
                            <div>
                                <span>
                                    YOUR WORKSPACES
                                </span>
                                <h2>
                                    Active projects
                                </h2>
                            </div>
                            <div className="projects-section-line" />
                        </div>

                        <div className="projects-grid">
                            {projects.map((project, index) => {
                                const isInitializing = initializingProject === project._id;
                                return (
                                    <article
                                        key={project._id}
                                        className="project-card"
                                    >
                                        <div className="project-card-glow" />
                                        <div className="project-card-top">
                                            <div className="project-number">
                                                {String((page - 1) * PROJECTS_PER_PAGE + index + 1).padStart(2, "0")}
                                            </div>
                                            <div className="project-status">
                                                <span />
                                                CONNECTED
                                            </div>
                                        </div>
                                        <div className="project-identity">
                                            <div className="project-icon">
                                                {project.name?.charAt(0)?.toUpperCase() || "P"}
                                            </div>
                                            <div className="project-name-area">
                                                <h2>
                                                    {project.name}
                                                </h2>
                                                <span>
                                                    {project.githubFullName}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="project-description">
                                            {project.description || "No description available for this repository."}
                                        </p>
                                        <div className="project-meta">
                                            <div className="project-meta-item">
                                                <span className="meta-label">
                                                    REPOSITORY
                                                </span>
                                                <strong>
                                                    {project.githubFullName || "Unknown"}
                                                </strong>
                                            </div>
                                            <div className="project-meta-item">
                                                <span className="meta-label">
                                                    DEFAULT BRANCH
                                                </span>
                                                <strong>
                                                    {project.defaultBranch || "main"}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="project-divider" />

                                        <div className="project-actions">
                                            <button
                                                className="initialize-button"
                                                onClick={() => initializeProject(project._id)}
                                                    disabled={isInitializing}
                                            >
                                                {isInitializing ? (
                                                    <>
                                                        <span className="button-spinner" />
                                                        Initializing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>
                                                            ◉
                                                        </span>
                                                        Initialize Codebase
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                className="workspace-button"
                                                onClick={() => navigate(`/projects/${project._id}/workspace`)}
                                            >
                                                Open Workspace
                                                <span>↗</span>
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="projects-pagination">
                            <button
                                className="projects-pagination-button"
                                onClick={goToPreviousPage}
                                disabled={!pagination.hasPreviousPage}
                            >
                                ← Previous
                            </button>
                            <div className="projects-pagination-status">
                                <span>PAGE</span>
                                <strong>
                                    {page}
                                </strong>
                                <small>
                                    OF{" "}
                                    {pagination.totalPages}
                                </small>
                            </div>

                            <button
                                className="projects-pagination-button"
                                onClick={goToNextPage}
                                disabled={!pagination.hasNextPage}
                            >
                                Next →
                            </button>
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="projects-bottom-cta">
                        <div>
                            <span className="projects-bottom-kicker">
                                NEED ANOTHER WORKSPACE?
                            </span>
                            <h2>
                                Connect another repository.
                            </h2>
                        </div>
                        <button
                            onClick={() => navigate("/repositories")}
                        >
                            Add Repository
                            <span>→</span>
                        </button>
                    </section>
                )}

                <footer className="projects-footer">
                    <span>AI-DevOS</span>
                    <span>
                        AI-POWERED DEVELOPMENT ENVIRONMENT
                    </span>
                </footer>
            </main>
        </div>
    );
};

export default Projects;