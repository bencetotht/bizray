import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Users, LogOut, Shield, TrendingUp, Settings, Lock } from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(() => {
    const userStr = localStorage.getItem("adminUser");
    return userStr ? JSON.parse(userStr) : null;
  });

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
                className={`admin-nav-item ${isActive("/admin/analytics") ? "active" : ""}`}
                onClick={() => navigate("/admin/analytics")}
              >
                <TrendingUp size={20} />
                Analytics
              </button>
              <button
                className={`admin-nav-item ${isActive("/admin/settings") ? "active" : ""}`}
                onClick={() => navigate("/admin/settings")}
              >
                <Settings size={20} />
                Settings
              </button>
              <button
                className={`admin-nav-item ${isActive("/admin/security") ? "active" : ""}`}
                onClick={() => navigate("/admin/security")}
              >
                <Lock size={20} />
                Security
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

