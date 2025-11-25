import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Shield, TrendingUp, Network } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://apibizray.bnbdevelopment.hu/api/v1/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

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
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    window.open(`/company/${suggestion.firmenbuchnummer}`, '_blank');
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    if (error) setError("");

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 150);
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
              <div className="hero-search-container" ref={suggestionsRef}>
                <div className="search-box">
                  <Search className="search-icon" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by company name, address, or person..." 
                    className={`search-input ${error ? "search-input-error" : ""}`}
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <button className="search-btn" onClick={handleSearch} aria-label="Search">
                    <ArrowRight size={20} />
                  </button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="hero-suggestions-dropdown">
                    {isLoading && (
                      <div className="hero-suggestion-item loading">
                        Loading suggestions...
                      </div>
                    )}
                    {!isLoading && suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.firmenbuchnummer}
                        className={`hero-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="hero-suggestion-name">{suggestion.name}</div>
                        <div className="hero-suggestion-id">{suggestion.firmenbuchnummer}</div>
                      </div>
                    ))}
                  </div>
                )}

                {showSuggestions && suggestions.length === 0 && !isLoading && searchQuery.length >= 3 && (
                  <div className="hero-suggestions-dropdown">
                    <div className="hero-suggestion-item no-results">
                      No companies found
                    </div>
                  </div>
                )}
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
                <svg className="network-lines" viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet">
                  <line x1="100" y1="0" x2="50" y2="30" stroke="#e2e8f0" strokeWidth="2" />
                  <line x1="100" y1="0" x2="100" y2="30" stroke="#e2e8f0" strokeWidth="2" />
                  <line x1="100" y1="0" x2="150" y2="30" stroke="#e2e8f0" strokeWidth="2" />
                </svg>
                <div className="network-nodes">
                  <div className="network-node">RO</div>
                  <div className="network-node">OT</div>
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
