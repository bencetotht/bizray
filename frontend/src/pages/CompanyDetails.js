// src/pages/CompanyDetails.js
import React from "react";
import { Shield, MapPin, Users, FileText, Calendar, AlertCircle, Building2, ChevronDown, ExternalLink, Triangle } from "lucide-react";
import "./CompanyDetails.css";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import CompanySummaryCard from "../components/CompanySummaryCard";
import NetworkGraph from "../components/NetworkGraph";


const displayValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return value;
};

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnersExpanded, setPartnersExpanded] = useState(true);
  const [registryExpanded, setRegistryExpanded] = useState(true);
  const [riskExpanded, setRiskExpanded] = useState(true);
  const getRiskColor = (score) => {
    if (score === null || score === undefined) return { bg: "#e2e8f0", color: "#4a5568" };
    if (score >= 0.7) return { bg: "#fed7d7", color: "#c53030" };
    if (score >= 0.4) return { bg: "#feebc8", color: "#d69e2e" };
    return { bg: "#c6f6d5", color: "#22543d" };

  };
  const getZoneColor = (v) => {
  if (v >= 0.7) return { bg: "#fed7d7", border: "#c53030" }; 
  if (v >= 0.4) return { bg: "#feebc8", border: "#d69e2e" };  
  return { bg: "#c6f6d5", border: "#22543d" };                
  };


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch company data");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.company) {
          setCompany(data.company);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching company data:", error);
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (company && company.partners) {
      const partnersCount = company.partners.length || 0;
      setPartnersExpanded(partnersCount <= 1);
    }
  }, [company]);

  useEffect(() => {
    if (company && company.registry_entries) {
      const entriesCount = company.registry_entries.length || 0;
      setRegistryExpanded(entriesCount <= 1);
    }
  }, [company]);

  //show a loading screen while fetching data
  if (loading || (!company && !notFound)) {
    return (
      <section className="company-details-section">
        <div className="container">
          <div className="company-card-wrapper">
            <div className="company-card">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading company details...</div>
              </div>
            </div>
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

  if (!company) {
    return null; 
  }

  const address = company.address || null;
  const partners = company.partners || [];
  const registryEntries = company.registry_entries || [];
  const riskIndicators = company.riskIndicators || {};

  return (
    <section className="company-details-section">
      <div className="container">
        <div className="company-card-wrapper">
          <div className="company-card company-card-scrollable">
            {/* Header */}
            <div className="card-header">
              <div className="company-info">
                <div className="company-avatar">
                  {company.name
                    ? company.name
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "??"}
                </div>
                <div>
                  <h2>{displayValue(company.name)}</h2>
                  <p>{displayValue(company.seat)}</p>
                </div>
              </div>
              <div
                className="overall-risk-badge header-risk-badge"
                style={{
                  background: getRiskColor(company.riskScore).bg,
                  color: getRiskColor(company.riskScore).color,
                }}
              >
                <Shield size={16} />
                <span className="overall-risk-text">
                  {company.riskScore === null || company.riskScore === undefined
                    ? "N/A"
                    : company.riskScore >= 0.7
                    ? "High"
                    : company.riskScore >= 0.4
                    ? "Medium"
                    : "Low"}
                </span>
                <span className="overall-risk-value">
                  {company.riskScore === null || company.riskScore === undefined
                    ? "N/A"
                    : Number(company.riskScore).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Summary Fields */}
            <CompanySummaryCard company={company} />

            {/* Address Section */}
            <div className="info-section">
              <h3 className="section-title"> 
                {/*open address in google maps when clicking on the map pin*/}
                <MapPin size={18} /> 
                Address
                {address && (address.street || address.city) && (
                  (() => {
                    const parts = [address.street, address.house_number, address.postal_code, address.city, address.country].filter(Boolean);
                    const query = encodeURIComponent(parts.join(" "));
                    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="toggle-btn"
                        aria-label="Open address in Google Maps"
                        title="Open in Google Maps"
                      >
                        <ExternalLink size={16} />
                      </a>
                    );
                  })()
                )}
              </h3>
              <div className="section-content">
                {address ? (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Street:</strong> {displayValue(address.street)}
                    </div>
                    <div className="detail-item">
                      <strong>House Number:</strong> {displayValue(address.house_number)}
                    </div>
                    <div className="detail-item">
                      <strong>Postal Code:</strong> {displayValue(address.postal_code)}
                    </div>
                    <div className="detail-item">
                      <strong>City:</strong> {displayValue(address.city)}
                    </div>
                    <div className="detail-item">
                      <strong>Country:</strong> {displayValue(address.country)}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Partners Section */}
            <div className="info-section">
              <h3 
                className="section-title"
                onClick={() => partners.length > 1 && setPartnersExpanded((v) => !v)}
                style={{ cursor: partners.length > 1 ? 'pointer' : 'default' }}
              >
                <Users size={18} />
                Partners <span className="count-badge">{partners.length}</span>
                {partners.length > 1 && (
                  <button
                    type="button"
                    className={`toggle-btn ${partnersExpanded ? "open" : ""}`}
                    aria-expanded={partnersExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPartnersExpanded((v) => !v);
                    }}
                  >
                    <ChevronDown size={16} />
                  </button>
                )}
              </h3>
              <div className={`section-content ${partnersExpanded ? "expanded" : "collapsed"}`}>
                {partners.length > 0 ? (
                  <div className="partners-list">
                    {partners.map((partner, index) => (
                      <div key={index} className="partner-card">
                        <div className="detail-item">
                          <strong>Name:</strong> {displayValue(partner.name)}
                        </div>
                        <div className="detail-item">
                          <strong>First Name:</strong> {displayValue(partner.first_name)}
                        </div>
                        <div className="detail-item">
                          <strong>Last Name:</strong> {displayValue(partner.last_name)}
                        </div>
                        <div className="detail-item">
                          <strong>Birth Date:</strong> {displayValue(partner.birth_date)}
                        </div>
                        {(partner.role !== null && partner.role !== undefined && partner.role !== "") && (
                          <div className="detail-item">
                            <strong>Role:</strong> {displayValue(partner.role)}
                          </div>
                        )}
                        {(partner.representation !== null && partner.representation !== undefined && partner.representation !== "") && (
                          <div className="detail-item">
                            <strong>Representation:</strong> {displayValue(partner.representation)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Registry Entries Section */}
            <div className="info-section">
              <h3 
                className="section-title"
                onClick={() => registryEntries.length > 1 && setRegistryExpanded((v) => !v)}
                style={{ cursor: registryEntries.length > 1 ? 'pointer' : 'default' }}
              >
                <FileText size={18} />
                Registry Entries <span className="count-badge">{registryEntries.length}</span>
                {registryEntries.length > 1 && (
                  <button
                    type="button"
                    className={`toggle-btn ${registryExpanded ? "open" : ""}`}
                    aria-expanded={registryExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRegistryExpanded((v) => !v);
                    }}
                  >
                    <ChevronDown size={16} />
                  </button>
                )}
              </h3>
              <div className={`section-content ${registryExpanded ? "expanded" : "collapsed"}`}>
                {registryEntries.length > 0 ? (
                  <div className="registry-list">
                    {registryEntries.map((entry, index) => (
                      <div key={index} className="registry-card">
                        <div className="detail-item">
                          <strong>Type:</strong> {displayValue(entry.type)}
                        </div>
                        <div className="detail-item">
                          <strong>Court:</strong> {displayValue(entry.court)}
                        </div>
                        <div className="detail-item">
                          <strong>File Number:</strong> {displayValue(entry.file_number)}
                        </div>
                        <div className="detail-item">
                          <strong>Application Date:</strong> {displayValue(entry.application_date)}
                        </div>
                        <div className="detail-item">
                          <strong>Registration Date:</strong> {displayValue(entry.registration_date)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Risk Indicators Section */}
            <div className="info-section">
              <h3 className="section-title" 
              onClick={() => Object.keys(riskIndicators).length > 0 && setRiskExpanded((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <AlertCircle size={18} />
                Risk Indicators
                <span className="tooltip">?
                  <span className="tooltip-text">
                    Risk indicators are normalized metrics reflecting financial, legal, and operational factors that may increase the company’s exposure to instability or compliance issues.
                  </span>
                </span>
                {Object.keys(riskIndicators).length > 0 && (
                  <button
                    type="button"
                    className={`toggle-btn ${riskExpanded ? "open" : ""}`}
                    aria-expanded={riskExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRiskExpanded((v) => !v);
                    }}
                  >
                    <ChevronDown size={16} />
                  </button>
                )}
              </h3>
              {/* Table */}
              <div className={`section-content ${riskExpanded ? "expanded" : "collapsed"}`}>
                <div className="risk-bars">
                  {Object.entries(riskIndicators)
                    .filter(([_, v]) => {
                      if (v === null || v === undefined) return false;
                      if (typeof v === "number" && isNaN(v)) return false;
                      return true;
                    })

                    .map(([key, raw]) => {
                      const isBoolean =
                        raw === 0 || raw === 1 || raw === true || raw === false;

                      let v = typeof raw === "boolean" ? Number(raw) : raw;
                      if (v > 1) v = 1;

                      const label = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                      return (
                        <div key={key} className="risk-bar-row">
                          <div className="risk-bar-label">
                            {label}
                            <span className="risk-info-tooltip">?
                              <span className="risk-info-tooltip-text">What does this category stand for?</span>
                            </span>
                          </div>
                          <div className="risk-bar-track">
                            <div
                              className="risk-bar-fill"
                              style={{ width: `${v * 100}%` }}
                            />
                            {/* Pointer */}
                            <div
                              className={`risk-bar-pointer ${v > 0.85 ? "flip-tooltip" : ""}`}
                              style={{ left: `${v * 100}%` }}
                            >
                              <div className="risk-pointer-hitbox"><Triangle size={12} fill="currentColor" /></div>
                              <span
                                className="risk-arrow-tooltip"
                                style={{
                                  background: getZoneColor(v).bg,
                                  border: `1px solid ${getZoneColor(v).border}`,
                                  color: "#1e293b"
                                }}
                              >
                                {isBoolean ? (raw === 1 ? "Yes" : "No") : v.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Reference Date */}
            <div className="info-section">
              <h3 className="section-title">
                <Calendar size={18} />
                Reference Date
              </h3>
              <div className="section-content">
                <div className="detail-item">{displayValue(company.reference_date)}</div>
              </div>
            </div>

            {/* Divider */}
            <hr className="divider" />

            {/* Network prototype */}
            <div className="info-section">
              <h3 className="section-title">
                <Building2 size={18} />
                Company Network (prototype)
              </h3>
              <p className="network-description">
                Preview of relationships to partner firms and holdings. Zoom, pan,
                and explore. This will later render real graph data from the API.
              </p>
              <Link
                to={`/graph/${id}`}
                id="graph_link"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <div className="  bg-blue flex justify-center items-center items-center">
                  Open full network view
                  <ExternalLink size={16} />
                </div>

              </Link>
              <NetworkGraph company={company} />
              
              

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
