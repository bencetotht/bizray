import React, { useState, useEffect } from "react";
import { BarChart3, Users, Building2, FileText, UserCircle } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./AdminMetricsPage.css";
import { API_PREFIX } from "../api/config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = API_PREFIX;

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();
      const apiMetrics = data.metrics || {};
      const userMetrics = data.user_metrics || {};
      
      setMetrics({
        ...apiMetrics,
        users: userMetrics.total_users || 0
      });
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }
      setError(err.message || "Failed to load metrics");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="admin-metrics-page">
        <div className="admin-metrics-card">
          <div className="loading-state">Loading metrics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-metrics-page">
        <div className="admin-metrics-card">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchMetrics} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-metrics-page">
      <div className="admin-metrics-header">
        <h1>Metrics Dashboard</h1>
        <p>Overview of system statistics and performance</p>
      </div>

      <div className="admin-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <Building2 size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Companies</h3>
            <p className="metric-value">{formatNumber(metrics?.companies || 0)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Addresses</h3>
            <p className="metric-value">{formatNumber(metrics?.addresses || 0)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Partners</h3>
            <p className="metric-value">{formatNumber(metrics?.partners || 0)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" }}>
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <h3>Registry Entries</h3>
            <p className="metric-value">{formatNumber(metrics?.registry_entries || 0)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
            <UserCircle size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <p className="metric-value">{formatNumber(metrics?.users || 0)}</p>
          </div>
        </div>
      </div>

      <div className="admin-metrics-details">
        {/* Chart Section */}
        <div className="metrics-section">
          <h2>
            <BarChart3 size={20} />
            Data Overview Chart
          </h2>
          <div className="chart-container">
            <Bar
              data={{
                labels: ["Companies", "Addresses", "Partners", "Registry Entries", "Users"],
                datasets: [
                  {
                    label: "Count",
                    data: [
                      metrics?.companies || 0,
                      metrics?.addresses || 0,
                      metrics?.partners || 0,
                      metrics?.registry_entries || 0,
                      metrics?.users || 0,
                    ],
                    backgroundColor: [
                      "rgba(102, 126, 234, 0.8)",
                      "rgba(240, 147, 251, 0.8)",
                      "rgba(79, 172, 254, 0.8)",
                      "rgba(67, 233, 123, 0.8)",
                      "rgba(250, 112, 154, 0.8)",
                    ],
                    borderColor: [
                      "rgba(102, 126, 234, 1)",
                      "rgba(240, 147, 251, 1)",
                      "rgba(79, 172, 254, 1)",
                      "rgba(67, 233, 123, 1)",
                      "rgba(250, 112, 154, 1)",
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return formatNumber(context.parsed.y);
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatNumber(value);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

