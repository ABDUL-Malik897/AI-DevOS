import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useToast } from "../../components/Toast/ToastContext";
import "./Repositories.css";

const REPOSITORIES_PER_PAGE = 12;

const Repositories = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState({
        totalRepositories: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 800);
        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        const fetchRepositories = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await API.get("/github/repos",
                    {
                        params: {
                            page,
                            per_page: REPOSITORIES_PER_PAGE,
                            search: debouncedSearch
                        }
                    }
                );
                setRepositories(response.data.repositories || []);
                setPagination(response.data.pagination || {
                    totalRepositories: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: page > 1
                });
            } catch (error) {
                const message = error.response?.data?.error || "Failed to load repositories";
                setError(message);
                setRepositories([]);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };
        fetchRepositories();
    }, [page,debouncedSearch,toast]);

    const goToPreviousPage = () => {
        if (!pagination.hasPreviousPage) {
            return;
        }
        setPage((currentPage) =>  Math.max(1, currentPage - 1)
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
            <div className="repositories-page">
                <div className="repositories-grid-bg" />
                <div className="repositories-loading">
                    <div className="repositories-loader" />
                    <span>
                        GITHUB CONNECTION
                    </span>
                    <h2>
                        Loading repositories...
                    </h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="repositories-page">
                <div className="repositories-grid-bg" />
                <div className="repositories-error-state">
                    <div className="repositories-error-icon">
                        !
                    </div>
                    <span>
                        REPOSITORY ACCESS ERROR
                    </span>
                    <h2>{error}</h2>
                    <button
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="repositories-page">
            <div className="repositories-grid-bg" />
            <div className="repositories-glow repositories-glow-one" />
            <div className="repositories-glow repositories-glow-two" />
            <header className="repositories-navbar">
                <div
                    className="repositories-brand"
                    onClick={() => navigate("/dashboard")
                    }
                >
                    <div className="repositories-brand-icon">
                        {">_"}
                    </div>
                    <div>
                        <div className="repositories-brand-name">
                            AI<span>DevOS</span>
                        </div>
                        <div className="repositories-brand-status">
                            GITHUB REPOSITORY CENTER
                        </div>
                    </div>
                </div>
                <div className="repositories-nav-actions">
                    <button
                        className="repositories-nav-button"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Dashboard
                    </button>
                    <button
                        className="repositories-projects-button"
                        onClick={() => navigate("/projects")}
                    >
                        My Projects
                    </button>
                </div>
            </header>
            <main className="repositories-container">
                <section className="repositories-header">
                    <div>
                        <div className="repositories-eyebrow">
                            <span className="repositories-status-dot" />
                            GITHUB CONNECTED
                        </div>
                        <h1>
                            GitHub{" "}
                            <span>
                                Repositories
                            </span>
                        </h1>
                        <p>
                            Select a repository to import it into AI-DevOS and create a new development workspace.
                        </p>
                    </div>
                    <div className="repositories-count-card">
                        <span className="repositories-count">
                            {pagination.totalRepositories}
                        </span>
                        <span className="repositories-count-label">
                            {pagination.totalRepositories === 1 ? "REPOSITORY" : "REPOSITORIES"}
                        </span>
                    </div>
                </section>

                <section className="repositories-section">
                    <div className="repositories-search">
                        <span className="repositories-search-icon">
                            ⌕
                        </span>
                        <input
                            type="text"
                            value={search}
                            placeholder="Search repositories..."
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        {search && (
                            <button
                                className="repositories-search-clear"
                                onClick={() => {
                                    setSearch("");
                                    setPage(1);
                                }}
                                aria-label="Clear repository search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {repositories.length === 0 ? (
                        <section className="repositories-empty">
                            <div className="repositories-empty-icon">
                                ◇
                            </div>
                            <div>
                                <span className="empty-kicker">
                                    {search ? "NO MATCHING REPOSITORIES" : "NO REPOSITORIES FOUND"}
                                </span>
                                <h2>
                                    {search ? "No repositories match your search." : "Your GitHub account is empty."}
                                </h2>
                                <p>
                                    {search ? `No repositories were found matching "${search}".` : "No repositories were returned from your connected GitHub account."}
                                </p>
                                {search ? (
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            setPage(1);
                                        }}
                                    >
                                        Clear Search
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                    >
                                        Return to Dashboard
                                    </button>
                                )}
                            </div>
                        </section>
                    ) : (
                        <>
                            <div className="repositories-section-heading">
                                <div>
                                    <span>
                                        AVAILABLE CODEBASES
                                    </span>
                                    <h2>
                                        {search ? "Search results" : "Choose a repository"}
                                    </h2>
                                </div>
                                <div className="repositories-section-line" />
                            </div>
                            <div className="repositories-grid">
                                {repositories.map((repo,index) => (
                                    <article
                                        className="repository-card"
                                        key={repo.id}
                                    >
                                        <div className="repository-card-glow" />
                                        <div className="repository-card-header">
                                            <div className="repository-number">
                                                {String((page - 1) * REPOSITORIES_PER_PAGE + index + 1).padStart(2, "0")}
                                            </div>
                                            <div
                                                className={`repository-visibility ${
                                                    repo.private
                                                        ? "private"
                                                        : "public"
                                                }`}
                                            >
                                                <span />
                                                {repo.private ? "PRIVATE" : "PUBLIC"}
                                            </div>
                                        </div>
                                        <div className="repository-identity">
                                            <div className="repository-icon">
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
                                            <div className="repository-title-area">
                                                <h2>
                                                    {repo.name}
                                                </h2>
                                                <span>
                                                    #{repo.id}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="repository-description">
                                            {repo.description || "No description available for this repository."}
                                        </p>
                                        <div className="repository-meta">
                                            <div className="repository-meta-box">
                                                <span>
                                                    LANGUAGE
                                                </span>
                                                <strong>
                                                    <i className="language-dot" />
                                                    {repo.language || "Unknown"}
                                                </strong>
                                            </div>
                                            <div className="repository-meta-box">
                                                <span>
                                                    ACCESS
                                                </span>
                                                <strong>
                                                    {repo.private ? "Private" : "Public"}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="repository-divider" />
                                        <button
                                            className="repository-use-button"
                                            onClick={() => navigate(`/projects/new?repo=${repo.id}`)}
                                        >
                                            <span>
                                                Use this repository
                                            </span>
                                            <strong>
                                                ↗
                                            </strong>
                                        </button>
                                    </article>
                                ))}
                            </div>

                            <div className="repositories-pagination">
                                <button
                                    className="repositories-pagination-button"
                                    onClick={goToPreviousPage}
                                    disabled={!pagination.hasPreviousPage}
                                >
                                    ← Previous
                                </button>

                                <div className="repositories-pagination-status">
                                    <span>
                                        PAGE
                                    </span>
                                    <strong>
                                        {page}
                                    </strong>
                                    {pagination.totalPages > 0 && (
                                        <small>
                                            OF{" "}
                                            {pagination.totalPages}
                                        </small>
                                    )}
                                </div>

                                <button
                                    className="repositories-pagination-button"
                                    onClick={goToNextPage}
                                    disabled={!pagination.hasNextPage}
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    )}
                </section>

                <section className="repositories-bottom">
                    <div>
                        <span>
                            AI-DEVOS WORKFLOW
                        </span>
                        <h2>
                            Repository → Project → Workspace
                        </h2>
                    </div>
                    <div className="workflow-track">
                        <div className="workflow-step active">
                            <span>
                                01
                            </span>
                            Repository
                        </div>
                        <div className="workflow-line" />
                        <div className="workflow-step">
                            <span>
                                02
                            </span>
                            Project
                        </div>
                        <div className="workflow-line" />
                        <div className="workflow-step">
                            <span>
                                03
                            </span>
                            Workspace
                        </div>
                    </div>
                </section>
                <footer className="repositories-footer">
                    <span>
                        AI-DevOS
                    </span>
                    <span>
                        AI-POWERED DEVELOPMENT ENVIRONMENT
                    </span>
                </footer>
            </main>
        </div>
    );
};

export default Repositories;