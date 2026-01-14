import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, MapPin, Eye } from 'lucide-react';
import './TrendingCompanies.css';

const TrendingCompanies = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('https://apibizray.bnbdevelopment.hu/api/v1/recommendations');
        const data = await response.json();
        
        if (data && data.recommendations && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();

    const interval = setInterval(fetchRecommendations, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCompanyClick = (companyId) => {
    navigate(`/company/${companyId}`);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading || !recommendations || recommendations.length === 0) {
    return null;
  }

  const duplicatedRecommendations = [
    ...recommendations,
    ...recommendations,
    ...recommendations,
    ...recommendations
  ];

  return (
    <div className="trending-full-section">
      {/* Header */}
      <div className="trending-section-header">
        <h2 className="trending-title">Trending Now</h2>
        <div className="trending-icon-box">
          <TrendingUp size={20} />
        </div>
      </div>
      
      {/* Subtitle */}
      <p className="trending-subtitle">
        Most visited companies in the past 24 hours
      </p>
      
      {/* Scrolling Ticker */}
      <div className="trending-ticker-wrapper">
        <div className="trending-ticker-track">
          {duplicatedRecommendations.map((company, index) => {
            const originalIndex = index % recommendations.length;
            const isTopThree = originalIndex < 3;
            
            return (
              <div
                key={`${company.company_id}-${index}`}
                className={`trending-card ${isTopThree ? 'trending-card-top' : ''}`}
                onClick={() => handleCompanyClick(company.company_id)}
              >
                {/* Avatar */}
                <div className="trending-card-avatar">
                  {getInitials(company.name)}
                </div>

                {/* Company Info */}
                <div className="trending-card-content">
                  <h3 className="trending-card-name">{company.name}</h3>
                  
                  <div className="trending-card-meta">
                    <MapPin size={14} />
                    <span>Vienna, Austria</span>
                  </div>

                  <div className="trending-card-firmen">
                    <span className="firmen-label">Firmenbuchnummer:</span>
                    <span className="firmen-number">{company.company_id}</span>
                  </div>

                  {/* View Count */}
                  <div className="trending-card-views">
                    <Eye size={18} />
                    <span className="views-number">{company.visit_count}</span>
                    <span className="views-label">views</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendingCompanies;
