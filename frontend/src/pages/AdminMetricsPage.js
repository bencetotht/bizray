import React, { useState, useEffect } from "react";
import { 
  BarChart3, Users, Building2, FileText, UserCircle, 
  Search, TrendingUp
} from "lucide-react";
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

const parsePrometheusMetrics = (text) => {
  const metrics = {};
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([0-9.Ee+-]+)$/);
    if (match) {
      const [, metricName, labelsStr, valueStr] = match;
      const numValue = parseFloat(valueStr);
      
      if (!isNaN(numValue)) {
        if (labelsStr) {
          if (!metrics[metricName]) {
            metrics[metricName] = [];
          }
          metrics[metricName].push({ labels: labelsStr, value: numValue });
        } else {
          metrics[metricName] = numValue;
        }
      }
    }
  }
  
  return metrics;
};

const getMetricValue = (metricData) => {
  if (typeof metricData === 'number') return metricData;
  if (Array.isArray(metricData)) {
    return metricData.reduce((sum, item) => sum + item.value, 0);
  }
  return 0;
};

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [prometheusMetrics, setPrometheusMetrics] = useState(null);
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
      
      const adminResponse = await fetch(`${API_BASE_URL}/admin/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!adminResponse.ok) {
        if (adminResponse.status === 401 || adminResponse.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch admin metrics");
      }

      const adminData = await adminResponse.json();
      const apiMetrics = adminData.metrics || {};
      const userMetrics = adminData.user_metrics || {};
      
      setMetrics({
        ...apiMetrics,
        users: userMetrics.total_users || 0
      });

        try {
          const hostname = window.location.hostname;
          const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";
          
          let metricsUrl;
          if (isLocal) {
            metricsUrl = "http://localhost:3000/metrics";
          } else {
            const baseUrl = API_BASE_URL.replace('/api/v1', '');
            metricsUrl = `${baseUrl}/metrics`;
          }
          
          console.log("Fetching metrics from:", metricsUrl);
          const promResponse = await fetch(metricsUrl);
          console.log("Metrics response status:", promResponse.status);
          
          if (promResponse.ok) {
            const promText = await promResponse.text();
            console.log("Metrics text (first 500 chars):", promText.substring(0, 500));
            const parsed = parsePrometheusMetrics(promText);
            console.log("Parsed metrics:", parsed);
            setPrometheusMetrics(parsed);
          } else {
            const errorText = await promResponse.text();
            console.warn("Prometheus metrics endpoint returned:", promResponse.status, errorText);
          }
        } catch (promErr) {
          console.error("Failed to fetch Prometheus metrics:", promErr);
        }
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
        <div>
          <h1>Metrics Dashboard</h1>
          <p>Overview of system statistics and performance</p>
        </div>
        <button onClick={fetchMetrics} className="btn btn-primary" style={{ marginTop: '8px' }}>
          Refresh Metrics
        </button>
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

      {/* Prometheus Metrics Sections */}
      {prometheusMetrics && (
        <>
          {/* API Usage Metrics */}
          <div className="metrics-section">
            <h2>
              <Search size={20} />
              API Usage Metrics
            </h2>
            <div className="admin-metrics-grid">
              <div className="metric-card">
                <div className="metric-icon" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                  <Search size={24} />
                </div>
                <div className="metric-content">
                  <h3>Company Searches</h3>
                  <p className="metric-value">{formatNumber(getMetricValue(prometheusMetrics.bizray_company_searches_total))}</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" }}>
                  <FileText size={24} />
                </div>
                <div className="metric-content">
                  <h3>Company Detail Views</h3>
                  <p className="metric-value">{formatNumber(getMetricValue(prometheusMetrics.bizray_company_detail_views_total))}</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
                  <TrendingUp size={24} />
                </div>
                <div className="metric-content">
                  <h3>PDF Exports</h3>
                  <p className="metric-value">{formatNumber(getMetricValue(prometheusMetrics.bizray_pdf_exports_total))}</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <BarChart3 size={24} />
                </div>
                <div className="metric-content">
                  <h3>Network Graph Requests</h3>
                  <p className="metric-value">{formatNumber(getMetricValue(prometheusMetrics.bizray_network_graph_requests_total))}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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

