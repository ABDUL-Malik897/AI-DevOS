import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import GoogleSuccess from "./pages/GoogleSuccess/GoogleSuccess";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";

import Landing from "./pages/Landing/Landing";

import Dashboard from "./pages/Dashboard/Dashboard";
import Repositories from "./pages/Repositories/Repositories";
import NewProject from "./pages/NewProject/NewProject";
import Projects from "./pages/Projects/Projects";
import Workspace from "./pages/Workspace/Workspace";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <PublicRoute>
                            <Landing />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/signup"
                    element={
                        <PublicRoute>
                            <Signup />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/auth/google/success"
                    element={<GoogleSuccess />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/repositories"
                    element={
                        <ProtectedRoute>
                            <Repositories />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects/new"
                    element={
                        <ProtectedRoute>
                            <NewProject />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects"
                    element={
                        <ProtectedRoute>
                            <Projects />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects/:projectId/workspace"
                    element={
                        <ProtectedRoute>
                            <Workspace />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
