// src/pages/CompanyDetails.js
import React from "react";
import { Shield } from "lucide-react";
import "./CompanyDetails.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CompanySummaryCard from "../components/CompanySummaryCard";
import NetworkGraph from "../components/NetworkGraph";

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCompany(null);
    setNotFound(false);
    setLoading(true);

    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetch(`https://apibizray.bnbdevelopment.hu/api/v1/company/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch company data");
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setCompany(data.company);
          setNotFound(false);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching company data:", error);
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <section className="company-details-section">
        <div className="container">
          <div className="company-card-wrapper">
            <div className="company-card">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="company-details-section">
        <div className="container">
          <div className="company-card-wrapper">
            <div className="company-card">
              <h2>Company Not Found</h2>
              <p>The company you're looking for does not exist or could not be found.</p>
              {id && <p>Company ID: {id}</p>}
            </div>
          </div>
        </div>
      </section>
    );
  }

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
                {company.riskScore}
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
