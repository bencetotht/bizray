import { Navigate, useNavigate } from "react-router-dom";
import { Shield, Home } from "lucide-react";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "transparent"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        border: "2px solid #fed7aa",
        borderRadius: "20px",
        padding: "48px",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "24px",
          color: "#f97316"
        }}>
          <Shield size={64} />
        </div>
        <h2 style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "#ea580c",
          margin: "0 0 16px 0"
        }}>
          Access Denied
        </h2>
        <p style={{
          fontSize: "1rem",
          color: "#9a3412",
          margin: "0 0 32px 0",
          fontWeight: 500
        }}>
          You do not have access to this page.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "16px 32px",
            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s ease"
          }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          <Home size={20} />
          Go to Home Page
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem("adminToken");
  const userStr = localStorage.getItem("adminUser");
  
  // if there is no token or user data -> redirect to admin login
  if (!token || !userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  // parse user data and their check role
  try {
    const user = JSON.parse(userStr);
    
    if (requireAdmin) {
      if (user.role !== "admin") {
        return <AccessDenied />;
      }
    }
  } catch (e) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

