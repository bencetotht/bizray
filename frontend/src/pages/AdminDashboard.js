import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { BarChart3, Users, LogOut, Shield, Settings, Home } from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./AdminDashboard.css";

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(() => {
    const userStr = localStorage.getItem("adminUser");
    return userStr ? JSON.parse(userStr) : null;
  });
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuthorization = () => {
      const token = localStorage.getItem("adminToken");
      const userStr = localStorage.getItem("adminUser");
      
      if (!token || !userStr) {
        setIsAuthorized(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role !== "admin") {
          setIsAuthorized("access_denied");
          return;
        }
        setIsAuthorized(true);
      } catch (e) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const isActive = (path) => {
    if (path === "/admin" && location.pathname === "/admin") {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  if (isAuthorized === null) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // if user is logged in but not admin -> show access denied
  if (isAuthorized === "access_denied") {
    return <AccessDenied />;
  }

    // if not authorized (no token/user) -> redirect to login
  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard-bg">
        <BackgroundNetwork />
        <div className="admin-dashboard-overlay" />
      </div>

      <div className="container">
        <div className="admin-dashboard-wrapper">
          <aside className="admin-sidebar">
            <div className="admin-user-info">
              <div className="admin-avatar">
                <Shield size={32} />
              </div>
              <h3>Admin Panel</h3>
              {adminUser && (
                <p>{adminUser.email}</p>
              )}
            </div>

            <nav className="admin-nav">
              <button
                className={`admin-nav-item ${isActive("/admin/metrics") ? "active" : ""}`}
                onClick={() => navigate("/admin/metrics")}
              >
                <BarChart3 size={20} />
                Metrics
              </button>
              <button
                className={`admin-nav-item ${isActive("/admin/users") ? "active" : ""}`}
                onClick={() => navigate("/admin/users")}
              >
                <Users size={20} />
                User Management
              </button>
              <button
                className={`admin-nav-item ${isActive("/admin/settings") ? "active" : ""}`}
                onClick={() => navigate("/admin/settings")}
              >
                <Settings size={20} />
                Settings
              </button>
            </nav>

            <div className="admin-actions">
              <button className="admin-logout" onClick={handleLogout}>
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </aside>

          <main className="admin-content">
            <Outlet />
            
            <div className="admin-mobile-logout">
              <button className="admin-logout" onClick={handleLogout}>
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

