import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Building2, Shield, ExternalLink } from "lucide-react";
import "./SearchResultCard.css";

export default function SearchResultCard({ company }) {
  const { firmenbuchnummer, name, seat, legal_form, riskScore } = company;

  // Generate avatar initials
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Determine risk score color
  const getRiskColor = (score) => {
    if (!score) return { bg: "#e2e8f0", color: "#4a5568" };
    if (score >= .7) return { bg: "#fed7d7", color: "#c53030" };
    if (score >= .4) return { bg: "#feebc8", color: "#d69e2e" };
    return { bg: "#c6f6d5", color: "#22543d" };
  };

  const riskStyle = getRiskColor(riskScore);

  return (
    <Link
      to={`/company/${firmenbuchnummer}`}
      className="search-result-card"
    >
      <div className="search-result-content">
        {/* Avatar and Header */}
        <div className="search-result-header">
          <div className="search-result-avatar">
            {initials}
          </div>
          <div className="search-result-info">
            <h3 className="search-result-name">{name}</h3>
            <div className="search-result-meta">
              <MapPin size={14} />
              <span>{seat}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="search-result-details">
          <div className="search-result-detail-item">
            <Building2 size={16} />
            <span>{legal_form}</span>
          </div>
          <div className="search-result-detail-item">
            <span className="firmenbuchnummer-label">Firmenbuchnummer:</span>
            <span className="firmenbuchnummer-value">{firmenbuchnummer}</span>
          </div>
        </div>

        {/* Footer with Risk Score */}
        <div className="search-result-footer">
          <div
            className="search-result-risk"
            style={{
              background: riskStyle.bg,
              color: riskStyle.color,
            }}
          >
            <Shield size={14} />
            <span>Risk Score: {riskScore ?? "N/A"}</span>
          </div>
          <div className="search-result-link">
            <span>View Details</span>
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

