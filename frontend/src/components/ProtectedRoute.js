import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem("adminToken");
  const userStr = localStorage.getItem("adminUser");
  
  if (!token || !userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireAdmin) {
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        return <Navigate to="/admin/login" replace />;
      }
    } catch (e) {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
}

