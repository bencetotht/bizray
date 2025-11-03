import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Network, TrendingUp, ArrowRight } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
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
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button className="search-btn" onClick={handleSearch} aria-label="Search">
                  <ArrowRight size={20} />
                </button>
              </div>
              <p className="search-hint">
                Over 2TB of open company data available for free search
              </p>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">2TB+</div>
                <div className="stat-label">Company Data</div>
              </div>
              <div className="stat">
                <div className="stat-number">100%</div>
                <div className="stat-label">Open Data</div>
              </div>
              <div className="stat">
                <div className="stat-number">EU</div>
                <div className="stat-label">HVD Compatible</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="card-header">
                <div className="company-info">
                  <div className="company-avatar">AC</div>
                  <div>
                    <h3>Evil Corp Ltd.</h3> {/* Sometimes I dream of saving the world... */}
                    <p>Budapest, Hungary</p>
                  </div>
                </div>
                <div className="risk-indicator low">
                  <Shield size={16} />
                  Low Risk
                </div>
              </div>
              
              <div className="network-preview">
                <div className="network-node main">AC</div>
                <div className="network-lines">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
                <div className="network-nodes">
                  <div className="network-node">BC</div>
                  <div className="network-node">DC</div>
                  <div className="network-node">EC</div>
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
