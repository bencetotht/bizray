import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Shield, TrendingUp, Network } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const navigate = useNavigate();

  // Format large numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  // Fetch metrics on component mount
  useEffect(() => {
    fetch('https://apibizray.bnbdevelopment.hu/api/v1/metrics')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return res.json();
      })
      .then((data) => {
        if (data && data.metrics) {
          setMetrics(data.metrics);
        }
      })
      .catch((error) => {
        console.error('Error fetching metrics:', error);
        // Keep metrics as null to show fallback stats
      });
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) {
      setError("Please enter a search term");
      return;
    }
    if (q.length < 3) {
      setError("Minimum search length is 3 characters");
      return;
    }
    setError("");
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Business <span className="text-gradient">Transparency</span><br />
              For Everyone
            </h1>
            <p className="hero-description">
              BizRay helps you understand who you're doing business with. Discover company 
              relationships, assess risks, and make informed business decisions based on 
              open data.
            </p>
            
            
            <div className="hero-search">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by company name, address, or person..." 
                  className={`search-input ${error ? "search-input-error" : ""}`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (error) setError(""); // Clear error when user types
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button className="search-btn" onClick={handleSearch} aria-label="Search">
                  <ArrowRight size={20} />
                </button>
              </div>
              {error ? (
                <p className="search-error">{error}</p>
              ) : (
                <p className="search-hint">
                  Over 2TB of open company data available for free search
                </p>
              )}
            </div>

            <div className="hero-stats">
              {metrics ? (
                <>
                  <div className="stat">
                    <div className="stat-number">{formatNumber(metrics.companies)}</div>
                    <div className="stat-label">Companies</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">{formatNumber(metrics.addresses)}</div>
                    <div className="stat-label">Addresses</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">{formatNumber(metrics.partners)}</div>
                    <div className="stat-label">Partners</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">{formatNumber(metrics.registry_entries)}</div>
                    <div className="stat-label">Registry Entries</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat">
                    <div className="stat-number stat-skeleton"></div>
                    <div className="stat-label stat-label-skeleton"></div>
                  </div>
                  <div className="stat">
                    <div className="stat-number stat-skeleton"></div>
                    <div className="stat-label stat-label-skeleton"></div>
                  </div>
                  <div className="stat">
                    <div className="stat-number stat-skeleton"></div>
                    <div className="stat-label stat-label-skeleton"></div>
                  </div>
                  <div className="stat">
                    <div className="stat-number stat-skeleton"></div>
                    <div className="stat-label stat-label-skeleton"></div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="card-header">
                <div className="company-info">
                  <div className="company-avatar">AC</div>
                  <div>
                    <h3>Evil Corp Ltd.</h3>

                    <p>Vienna, Austria</p>
                  </div>
                </div>
                <div className="risk-indicator low">
                  <Shield size={16} />
                  Low Risk
                </div>
              </div>
              
              <div className="network-preview">
                <div className="network-node main">EC</div>
                <div className="network-lines">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
                <div className="network-nodes">
                  <div className="network-node">RO</div>
                  <div className="network-node">OT</div> {/* root@elliot */}
                  <div className="network-node">EL</div>
                </div>
              </div>
              
              <div className="card-footer">
                <div className="metric">
                  <TrendingUp size={16} />
                  <span>PageRank: 0.85</span>
                </div>
                <div className="metric">
                  <Network size={16} />
                  <span>3 connections</span>
                </div>
              </div>
            </div>
          </div> 
        </div>
      </div>
    </section>
  );
};

export default Hero;
