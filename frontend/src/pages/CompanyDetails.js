// src/pages/CompanyDetails.js
import React, { useMemo } from "react";
import { Shield } from "lucide-react";
import CompanySummaryCard from "../components/CompanySummaryCard";
import NetworkGraph from "../components/NetworkGraph";   // ⬅️ NEW
import "./CompanyDetails.css";

export default function CompanyDetails() {
  const company = useMemo(
    () => ({
      firmenbuchnummer: "661613k",
      name: "Körpermanufaktur KG",
      legal_form: "Kommanditgesellschaft",
      business_purpose:
        "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
      seat: "Dornbirn",
    }),
    []
  );

  return (
    <section className="company-details-section">
      <div className="container">
        <div className="company-card-wrapper">
          <div className="company-card">
            {/* Header */}
            <div className="card-header">
              <div className="company-info">
                <div className="company-avatar">
                  {company.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2>{company.name}</h2>
                  <p>{company.seat}</p>
                </div>
              </div>
              <div className="risk-indicator low">
                <Shield size={16} />
                Low Risk
              </div>
            </div>

            {/* Summary Fields */}
            <CompanySummaryCard company={company} />

            {/* Divider */}
            <hr className="divider" />

            {/* Network prototype (inside same card) */}
            <h3 className="network-title">Company Network (prototype)</h3>
            <p className="network-description">
              Preview of relationships to partner firms and holdings. Zoom, pan,
              and explore. This will later render real graph data from the API.
            </p>
            <NetworkGraph company={company} />
          </div>
        </div>
      </div>
    </section>
  );
}
