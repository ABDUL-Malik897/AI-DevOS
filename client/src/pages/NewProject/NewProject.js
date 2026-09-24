import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api/api";
import { useToast } from "../../components/Toast/ToastContext";
import "./NewProject.css";

const NewProject = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const repoId = searchParams.get("repo");
    const [repo, setRepo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRepository = async () => {
            try {
                const response = await API.get("/github/repos");
                const selectedRepo = response.data.repositories.find((repo) => String(repo.id) === String(repoId));
                if (!selectedRepo) {
                    const message = "Repository could not be found";
                    setError(message);
                    toast.error(message);
                    return;
                }
                setRepo(selectedRepo);
            } catch (error) {
                const message = error.response?.data?.error || "Failed to load repository";
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };
        if (repoId) {
            fetchRepository();
        } else {
            const message = "Repository not selected";
            setError(message);
            toast.error(message);
            setLoading(false);

        }
    }, [repoId,toast]);

    const createProject = async () => {
        if (!repo) {
            return;
        }
        setCreating(true);
        setError("");
        try {
            await API.post("/projects", {
                name: repo.name,
                description: repo.description || "",
                githubRepoId: String(repo.id),
                githubRepoName: repo.name,
                githubFullName: repo.fullName,
                githubOwner: repo.fullName.split("/")[0],
                githubUrl: repo.htmlUrl,
                defaultBranch: repo.defaultBranch,
                language: repo.language
            });
            toast.success("Project created successfully");
            navigate("/projects");
        } catch (error) {
                const message = error.response?.data?.error || "Failed to create project";
                setError(message);
                toast.error(message);
            } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="new-project-page">
                <div className="new-project-grid" />
                <div className="new-project-loading">
                    <div className="new-project-loader" />
                    <span>
                        AI-DEVOS INITIALIZATION
                    </span>
                    <h2>
                        Loading repository...
                    </h2>
                </div>
            </div>
        );
    }

    if (error && !repo) {
        return (
            <div className="new-project-page">
                <div className="new-project-grid" />
                <div className="new-project-error-state">
                    <div className="new-project-error-icon">
                        !
                    </div>
                    <span>
                        REPOSITORY ERROR
                    </span>
                    <h2>
                        {error}
                    </h2>
                    <button
                        onClick={() => navigate("/repositories")}
                    >
                        ← Back to Repositories
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="new-project-page">
            <div className="new-project-grid" />
            <div className="new-project-glow new-project-glow-one" />
            <div className="new-project-glow new-project-glow-two" />
            <header className="new-project-navbar">
                <div
                    className="new-project-brand"
                    onClick={() => navigate("/dashboard")}
                >
                    <div className="new-project-brand-icon">
                        {">_"}
                    </div>
                    <div>
                        <div className="new-project-brand-name">
                            AI<span>DevOS</span>
                        </div>
                        <div className="new-project-brand-status">
                            PROJECT INITIALIZATION
                        </div>
                    </div>
                </div>
                <div className="new-project-nav-actions">
                    <button
                        className="new-project-nav-button"
                        onClick={() => navigate("/repositories")}
                    >
                        ← Repositories
                    </button>
                    <button
                        className="new-project-nav-button"
                        onClick={() =>
                            navigate("/projects")
                        }
                    >
                        My Projects
                    </button>
                </div>
            </header>
            <main className="new-project-container">
                <section className="new-project-layout">
                    <div className="new-project-intro">
                        <div className="new-project-eyebrow">
                            <span className="new-project-status-dot" />
                            NEW WORKSPACE
                        </div>
                        <h1>
                            Create your
                            <span>
                                AI-DevOS Project
                            </span>
                        </h1>
                        <p>
                            You're one step away from turning this GitHub repository into an AI-powered development workspace.
                        </p>
                        <div className="new-project-workflow">
                            <div className="new-project-workflow-item active">
                                <div className="workflow-number">
                                    01
                                </div>
                                <div>
                                    <strong>
                                        Repository
                                    </strong>
                                    <span>
                                        GitHub connected
                                    </span>
                                </div>
                            </div>
                            <div className="new-project-workflow-line" />
                            <div className="new-project-workflow-item active">
                                <div className="workflow-number">
                                    02
                                </div>
                                <div>
                                    <strong>
                                        Project
                                    </strong>
                                    <span>
                                        Configure workspace
                                    </span>
                                </div>
                            </div>
                            <div className="new-project-workflow-line" />
                            <div className="new-project-workflow-item">
                                <div className="workflow-number">
                                    03
                                </div>
                                <div>
                                    <strong>
                                        Workspace
                                    </strong>
                                    <span>
                                        Start coding
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {repo && (
                        <section className="new-project-card">
                            <div className="new-project-card-header">
                                <div>
                                    <span>
                                        SELECTED REPOSITORY
                                    </span>
                                    <h2>
                                        Review project
                                    </h2>
                                </div>
                                <div className="new-project-card-status">
                                    <span />
                                    READY
                                </div>
                            </div>
                            <div className="new-project-repo">
                                <div className="new-project-repo-icon">
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
                                <div className="new-project-repo-info">
                                    <h3>
                                        {repo.name}
                                    </h3>
                                    <span>
                                        {repo.fullName}
                                    </span>
                                </div>
                            </div>
                            <div className="new-project-description">
                                <span>
                                    DESCRIPTION
                                </span>
                                <p>
                                    {repo.description || "No description available for this repository."}
                                </p>
                            </div>
                            <div className="new-project-meta">
                                <div>
                                    <span>
                                        DEFAULT BRANCH
                                    </span>
                                    <strong>
                                        {repo.defaultBranch || "main"}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        LANGUAGE
                                    </span>
                                    <strong>
                                        <i />
                                        {repo.language || "Unknown"}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        VISIBILITY
                                    </span>
                                    <strong>
                                        {repo.private ? "Private" : "Public"}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        GITHUB
                                    </span>
                                    <strong>
                                        Connected
                                    </strong>
                                </div>
                            </div>
                            <div className="new-project-info">
                                <div className="new-project-info-icon">
                                    ✦
                                </div>
                                <div>
                                    <strong>
                                        What happens next?
                                    </strong>
                                    <p>
                                        AI-DevOS will create a project linked to this repository. You can then initialize the codebase and open the full AI development workspace.
                                    </p>
                                </div>
                            </div>
                            {error && (
                                <div className="new-project-inline-error">
                                    <span>!</span>
                                    {error}
                                </div>
                            )}
                            <div className="new-project-actions">
                                <button
                                    className="new-project-cancel"
                                    onClick={() => navigate("/repositories")}
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="new-project-create"
                                    onClick={createProject}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <>
                                            <span className="create-spinner" />
                                            Creating Project...
                                        </>
                                    ) : (
                                        <>
                                            Create Project
                                            <span>→</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>
                    )}
                </section>
                <footer className="new-project-footer">
                    <span>
                        AI-DevOS
                    </span>
                    <span>
                        GITHUB → PROJECT → AI WORKSPACE
                    </span>
                </footer>
            </main>
        </div>
    );
};

export default NewProject;