import React, { useState, useEffect } from "react";
import { Shield, Ban, CheckCircle, Globe, UserX } from "lucide-react";
import "./AdminSecurityPage.css";

const API_BASE_URL = "https://apibizray.bnbdevelopment.hu/api/v1";

export default function AdminSecurityPage() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      
      if (token === "dev-mock-admin-token") {
        setTimeout(() => {
          setBlockedUsers([
            { id: 1, email: "spam@example.com", reason: "Suspicious activity", blockedAt: "2024-01-15" },
            { id: 2, email: "abuse@example.com", reason: "Terms violation", blockedAt: "2024-01-20" }
          ]);
          setBlockedIPs([
            { ip: "192.168.1.100", reason: "Multiple failed logins", blockedAt: "2024-01-18" },
            { ip: "10.0.0.50", reason: "Suspicious requests", blockedAt: "2024-01-19" }
          ]);
          setLoading(false);
        }, 500);
        return;
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching security data:", err);
      setLoading(false);
    }
  };

  const handleBlockUser = (userId) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      setBlockedUsers(prev => [...prev, { id: userId, email: "user@example.com", reason: "Manual block", blockedAt: new Date().toISOString() }]);
    }
  };

  const handleUnblockUser = (userId) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleBlockIP = (ip) => {
    if (window.confirm(`Are you sure you want to block IP ${ip}?`)) {
      setBlockedIPs(prev => [...prev, { ip, reason: "Manual block", blockedAt: new Date().toISOString() }]);
    }
  };

  const handleUnblockIP = (ip) => {
    setBlockedIPs(prev => prev.filter(i => i.ip !== ip));
  };

  if (loading) {
    return (
      <div className="admin-security-page">
        <div className="admin-security-card">
          <div className="loading-state">Loading security data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-security-page">
      <div className="admin-security-header">
        <div>
          <h1>Security</h1>
          <p>Manage security settings, blocked users, and IP addresses</p>
        </div>
        <button onClick={fetchSecurityData} className="btn btn-secondary">
          <Shield size={18} />
          Refresh
        </button>
      </div>

      <div className="security-sections">
        {/* Blocked Users */}
        <div className="security-section">
          <div className="security-section-header">
            <UserX size={20} />
            <h2>Blocked Users</h2>
          </div>
          <div className="security-content">
            {blockedUsers.length === 0 ? (
              <div className="empty-state">
                <Shield size={32} />
                <p>No blocked users</p>
              </div>
            ) : (
              <div className="blocked-list">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="blocked-item">
                    <div className="blocked-info">
                      <div className="blocked-email">{user.email}</div>
                      <div className="blocked-reason">{user.reason}</div>
                      <div className="blocked-time">Blocked: {user.blockedAt}</div>
                    </div>
                    <button
                      className="btn-unblock"
                      onClick={() => handleUnblockUser(user.id)}
                    >
                      <CheckCircle size={18} />
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => {
              const email = prompt("Enter email to block:");
              if (email) handleBlockUser(Date.now());
            }}>
              <Ban size={18} />
              Block User
            </button>
          </div>
        </div>

        {/* Blocked IPs */}
        <div className="security-section">
          <div className="security-section-header">
            <Globe size={20} />
            <h2>Blocked IP Addresses</h2>
          </div>
          <div className="security-content">
            {blockedIPs.length === 0 ? (
              <div className="empty-state">
                <Shield size={32} />
                <p>No blocked IP addresses</p>
              </div>
            ) : (
              <div className="blocked-list">
                {blockedIPs.map((item, index) => (
                  <div key={index} className="blocked-item">
                    <div className="blocked-info">
                      <div className="blocked-email">{item.ip}</div>
                      <div className="blocked-reason">{item.reason}</div>
                      <div className="blocked-time">Blocked: {item.blockedAt}</div>
                    </div>
                    <button
                      className="btn-unblock"
                      onClick={() => handleUnblockIP(item.ip)}
                    >
                      <CheckCircle size={18} />
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => {
              const ip = prompt("Enter IP address to block:");
              if (ip) handleBlockIP(ip);
            }}>
              <Ban size={18} />
              Block IP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

