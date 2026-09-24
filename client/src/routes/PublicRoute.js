import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#050816",
                    color: "#4de7ff",
                    fontFamily: "sans-serif"
                }}
            >
                Checking authentication...
            </div>
        );
    }

    if (user) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }
    return children;
};

export default PublicRoute;