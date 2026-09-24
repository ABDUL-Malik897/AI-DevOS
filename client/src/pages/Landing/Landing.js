import { Link } from "react-router-dom";
import "./Landing.css";

const features = [
    {
        icon: "</>",
        title: "Clone Repositories",
        text: "Import GitHub repositories and start coding instantly."
    },
    {
        icon: "▣",
        title: "Powerful Code Editor",
        text: "Edit your projects with a powerful browser-based Monaco editor."
    },
    {
        icon: "✦",
        title: "AI Assistant",
        text: "Ask questions, explain code, fix errors and generate solutions."
    },
    {
        icon: "⌕",
        title: "Semantic Search",
        text: "Find relevant code using natural-language questions."
    },
    {
        icon: ">_",
        title: "Run Builds",
        text: "Execute builds and inspect the results directly inside your workspace."
    },
    {
        icon: "✓",
        title: "AI Code Review",
        text: "Combine static analysis with AI-powered project reviews."
    },
    {
        icon: "◈",
        title: "Static Analysis",
        text: "Run ESLint and detect problems before they reach production."
    },
    {
        icon: "↗",
        title: "Deploy Ready",
        text: "Build, validate and prepare projects for deployment."
    }
];

const Landing = () => {

    return (
        <div className="landing-page">
            <div className="landing-grid" />
            <div className="landing-orb landing-orb-one" />
            <div className="landing-orb landing-orb-two" />
            <div className="landing-orb landing-orb-three" />
            <header className="landing-navbar">
                <div className="landing-nav-inner">
                    <Link
                        to="/"
                        className="brand"
                    >
                        <div className="brand-mark">
                            <span>A</span>
                            <i>&lt;/&gt;</i>
                        </div>
                        <div className="brand-copy">
                            <strong>AI-Dev<span>OS</span></strong>
                            <small>Code • Build • Ship • Smarter</small>
                        </div>
                    </Link>
                    <nav className="landing-nav-links">
                        <a href="#features">
                            Features
                        </a>
                        <a href="#workflow">
                            How It Works
                        </a>
                        <a href="#developers">
                            For Developers
                        </a>
                    </nav>
                    <div className="landing-nav-actions">
                        <Link
                            to="/login"
                            className="nav-signin"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="nav-start"
                        >
                            Get Started
                            <span>→</span>
                        </Link>
                    </div>
                </div>
            </header>
            <main>
                <section className="hero-section">
                    <div className="hero-container">
                        <div className="hero-content">
                            <div className="hero-badge">
                                <span className="badge-dot" />
                                <span>
                                    Your AI-Powered Development Operating System
                                </span>
                            </div>
                            <h1>
                                Code Smarter.
                                <br />
                                <span>Build Faster.</span>
                            </h1>
                            <p className="hero-description">
                                AI-DevOS is your all-in-one development workspace. Clone repositories, edit code, run builds, fix errors and get intelligent AI assistance — all in your browser.
                            </p>
                            <div className="hero-actions">
                                <Link
                                    to="/signup"
                                    className="primary-button"
                                >
                                    Get Started
                                    <span>→</span>
                                </Link>
                                <a
                                    href="#workflow"
                                    className="secondary-button"
                                >
                                    <span className="play-icon">
                                        ▶
                                    </span>
                                    See How It Works
                                </a>
                            </div>
                            <div className="hero-trust">
                                <div className="trust-item">
                                    <strong>AI</strong>
                                    <span>Powered</span>
                                </div>
                                <div className="trust-divider" />
                                <div className="trust-item">
                                    <strong>∞</strong>
                                    <span>Possibilities</span>
                                </div>
                                <div className="trust-divider" />
                                <div className="trust-item">
                                    <strong>24/7</strong>
                                    <span>Workspace</span>
                                </div>
                            </div>
                        </div>
                        <div className="hero-visual">
                            <div className="visual-glow" />
                            <div className="ide-window">
                                <div className="ide-topbar">
                                    <div className="window-controls">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <div className="ide-title">
                                        AI-DevOS
                                    </div>
                                    <div className="ide-status">
                                        <span />
                                        Ready
                                    </div>
                                </div>
                                <div className="ide-body">
                                    <aside className="ide-sidebar">
                                        <div className="sidebar-title">
                                            EXPLORER
                                        </div>
                                        <div className="tree-item tree-folder">
                                            <span>⌄</span>
                                            src
                                        </div>
                                        <div className="tree-item nested">
                                            <span>⌄</span>
                                            components
                                        </div>
                                        <div className="tree-item nested-2 active-tree">
                                            <span>◈</span>
                                            App.jsx
                                        </div>
                                        <div className="tree-item nested-2">
                                            <span>◈</span>
                                            Header.jsx
                                        </div>
                                        <div className="tree-item nested">
                                            <span>⌄</span>
                                            context
                                        </div>
                                        <div className="tree-item">
                                            <span>◫</span>
                                            package.json
                                        </div>
                                        <div className="tree-item">
                                            <span>◫</span>
                                            README.md
                                        </div>
                                    </aside>
                                    <div className="code-area">
                                        <div className="code-tab">
                                            <span className="tab-icon">◈</span>
                                            App.jsx
                                            <span className="tab-close">
                                                ×
                                            </span>
                                        </div>
                                        <div className="code-editor">
                                            <div className="line">
                                                <span className="line-number">
                                                    1
                                                </span>
                                                <span className="code-purple">
                                                    import
                                                </span>
                                                <span className="code-white">
                                                    React
                                                </span>
                                                <span className="code-purple">
                                                    from
                                                </span>
                                                <span className="code-green">
                                                    "react"
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    2
                                                </span>
                                                <span className="code-purple">
                                                    import
                                                </span>
                                                <span className="code-white">
                                                    AIWorkspace
                                                </span>
                                                <span className="code-purple">
                                                    from
                                                </span>
                                                <span className="code-green">
                                                    "./workspace"
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    3
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    4
                                                </span>
                                                <span className="code-purple">
                                                    function
                                                </span>
                                                <span className="code-blue">
                                                    App
                                                </span>
                                                <span className="code-white">
                                                    () {"{"}
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    5
                                                </span>
                                                <span className="code-white">
                                                    &nbsp;&nbsp;return (
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    6
                                                </span>
                                                <span className="code-white">
                                                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;
                                                </span>
                                                <span className="code-blue">
                                                    AIWorkspace
                                                </span>
                                                <span className="code-white">
                                                    /&gt;
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    7
                                                </span>
                                                <span className="code-white">
                                                    &nbsp;&nbsp;)
                                            </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    8
                                                </span>
                                                <span className="code-white">
                                                    {"}"}
                                                </span>
                                            </div>
                                            <div className="line">
                                                <span className="line-number">
                                                    9
                                                </span>
                                                <span className="code-purple">
                                                    export default
                                                </span>
                                                <span className="code-blue">
                                                    App
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ide-bottom">
                                            <div>
                                                <span className="bottom-dot" />
                                                main
                                            </div>
                                            <div>
                                                UTF-8
                                            </div>
                                            <div>
                                                JavaScript
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="floating-card floating-ai">
                                <div className="floating-icon">
                                    ✦
                                </div>
                                <div>
                                    <strong>
                                        Ask AI
                                    </strong>
                                    <span>
                                        Explain • Fix • Generate
                                    </span>
                                </div>
                            </div>
                            <div className="floating-card floating-build">
                                <div className="floating-icon">
                                    ✓
                                </div>
                                <div>
                                    <strong>
                                        Run Build
                                    </strong>
                                    <span>
                                        200 • Success
                                    </span>
                                </div>
                            </div>
                            <div className="floating-card floating-review">
                                <div className="floating-icon">
                                    ◈
                                </div>
                                <div>
                                    <strong>
                                        Code Review
                                    </strong>
                                    <span>
                                        AI-powered insights
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section
                    id="features"
                    className="features-section"
                >
                    <div className="section-heading">
                        <span className="section-eyebrow">
                            EVERYTHING IN ONE PLACE
                        </span>
                        <h2>
                            Everything You Need,
                            <br />
                            <span>In One Workspace.</span>
                        </h2>
                        <p>
                            Stop switching between tools.
                            AI-DevOS brings your entire development workflow together.
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature) => (
                            <div
                                className="feature-card"
                                key={feature.title}
                            >
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <div className="feature-glow" />
                                <h3>
                                    {feature.title}
                                </h3>
                                <p>
                                    {feature.text}
                                </p>
                                <span className="feature-arrow">
                                    →
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <section
                    id="workflow"
                    className="workflow-section"
                >
                    <div className="workflow-container">
                        <div className="workflow-copy">
                            <span className="section-eyebrow">
                                A BETTER DEVELOPMENT LOOP
                            </span>
                            <h2>
                                From idea
                                <br />
                                <span>to shipped code.</span>
                            </h2>
                            <p>
                                AI-DevOS combines your repository, editor, AI assistant, testing and code analysis into one seamless development environment.
                            </p>
                            <Link
                                to="/signup"
                                className="primary-button"
                            >
                                Start Building
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="workflow-steps">
                            <div className="workflow-line" />
                            <div className="workflow-step">
                                <div className="step-number">
                                    01
                                </div>
                                <div>
                                    <h3>
                                        Import
                                    </h3>
                                    <p>
                                        Connect your repository and bring your code into your browser.
                                    </p>
                                </div>
                            </div>
                            <div className="workflow-step">
                                <div className="step-number">
                                    02
                                </div>
                                <div>
                                    <h3>
                                        Build
                                    </h3>
                                    <p>
                                        Write and modify code using the integrated editor.
                                    </p>
                                </div>
                            </div>
                            <div className="workflow-step">
                                <div className="step-number">
                                    03
                                </div>
                                <div>
                                    <h3>
                                        Ask AI
                                    </h3>
                                    <p>
                                        Understand, debug, review and improve your code.
                                    </p>
                                </div>
                            </div>
                            <div className="workflow-step">
                                <div className="step-number">
                                    04
                                </div>
                                <div>
                                    <h3>
                                        Ship
                                    </h3>
                                    <p>
                                        Validate your application and prepare it for deployment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section
                    id="developers"
                    className="developer-section"
                >
                    <div className="developer-panel">
                        <div className="developer-copy">
                            <span className="section-eyebrow">
                                BUILT FOR MODERN DEVELOPERS
                            </span>
                            <h2>
                                Your development
                                <br />
                                <span>workspace, upgraded.</span>
                            </h2>
                            <p>
                                Whether you're learning, building side projects or working on serious applications, AI-DevOS keeps the important parts of development
                            </p>
                        </div>
                        <div className="developer-stats">
                            <div>
                                <strong>
                                    10x
                                </strong>
                                <span>
                                    Faster Development
                                </span>
                            </div>
                            <div>
                                <strong>
                                    AI
                                </strong>
                                <span>
                                    Powered Assistant
                                </span>
                            </div>
                            <div>
                                <strong>
                                    0
                                </strong>
                                <span>
                                    Local Setup Required
                                </span>
                            </div>
                            <div>
                                <strong>
                                    ∞
                                </strong>
                                <span>
                                    Possibilities
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="final-cta">
                    <div className="cta-glow" />
                    <span className="section-eyebrow">
                        READY TO BUILD?
                    </span>
                    <h2>
                        Transform your
                        <br />
                        <span>development workflow.</span>
                    </h2>
                    <p>
                        Join the next generation of developers building smarter with AI-DevOS.
                    </p>
                    <div className="hero-actions">
                        <Link
                            to="/signup"
                            className="primary-button"
                        >
                            Get Started Free
                            <span>→</span>
                        </Link>
                        <Link
                            to="/login"
                            className="secondary-button"
                        >
                            Sign In
                        </Link>
                    </div>
                </section>
            </main>
            <footer className="landing-footer">
                <div className="footer-brand">
                    <div className="brand-mark">
                        <span>A</span>
                        <i>&lt;/&gt;</i>
                    </div>
                    <div className="brand-copy">
                        <strong>
                            AI-Dev<span>OS</span>
                        </strong>
                        <small>
                            Code • Build • Ship • Smarter
                        </small>
                    </div>
                </div>
                <p>
                    © 2026 AI-DevOS. Built for modern developers.
                </p>
                <div className="footer-links">
                    <a href="#features">
                        Features
                    </a>
                    <a href="#workflow">
                        Workflow
                    </a>
                    <Link to="/login">
                        Login
                    </Link>
                    <Link to="/signup">
                        Signup
                    </Link>
                </div>
            </footer>
        </div>
    );
};

export default Landing;