// src/pages/CompanyDetails.js
import React from "react";
import { Shield, MapPin, Users, FileText, Calendar, AlertCircle, Building2, ChevronDown, ExternalLink } from "lucide-react";
import "./CompanyDetails.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CompanySummaryCard from "../components/CompanySummaryCard";
import NetworkGraph from "../components/NetworkGraph";

//render empty string for missing values
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

  // Show loading screen while fetching data
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
              <div className="risk-indicator low">
                <Shield size={16} />
                {displayValue(company.riskScore)}
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
                        <div className="detail-item">
                          <strong>Role:</strong> {displayValue(partner.role)}
                        </div>
                        <div className="detail-item">
                          <strong>Representation:</strong> {displayValue(partner.representation)}
                        </div>
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
              <h3 className="section-title">
                <AlertCircle size={18} />
                Risk Indicators
              </h3>
              <div className="section-content">
                {Object.keys(riskIndicators).length > 0 ? (
                  <div className="detail-grid">
                    {Object.entries(riskIndicators).map(([key, value]) => (
                      <div key={key} className="detail-item">
                        <strong>{key}:</strong> {displayValue(value)}
                      </div>
                    ))}
                  </div>
                ) : null}
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
              <NetworkGraph company={company} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
