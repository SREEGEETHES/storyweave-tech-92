import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useUser();
    const location = useLocation();

    // TEMPORARY: Bypass login for development
    // if (loading) ... (keep or remove loading check if desired, but for now just render children)

    // Render children immediately to bypass auth
    return <>{children}</>;
};

export default ProtectedRoute;
