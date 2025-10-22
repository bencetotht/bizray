import React from 'react';
import { Database, Users, Network, Shield, TrendingUp, Globe } from 'lucide-react';
import './Stats.css';

const Stats = () => {
  const stats = [
    {
      icon: <Database size={32} />,
      number: "2TB+",
      label: "Company Data",
      description: "Complete open database available via API and FTP server"
    },
    {
      icon: <Users size={32} />,
      number: "100%",
      label: "Transparency", 
      description: "All company data publicly accessible and interpretable"
    },
    {
      icon: <Network size={32} />,
      number: "1000+",
      label: "Nodes",
      description: "Network visualization with up to 1000 simultaneous connections"
    },
    {
      icon: <Shield size={32} />,
      number: "EU",
      label: "HVD Compatible",
      description: "Compliant with High Value Datasets directive"
    },
    {
      icon: <TrendingUp size={32} />,
      number: "3s",
      label: "Search Time",
      description: "Fast search results within 3 seconds"
    },
    {
      icon: <Globe size={32} />,
      number: "API",
      label: "Integration",
      description: "API key access via eID (ID Austria)"
    }
  ];

  return (
    <section className="section stats">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">BizRay in Numbers</h2>
          <p className="section-subtitle">
            Reliable, fast, and transparent business intelligence for everyone
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-highlight">
          <div className="highlight-content">
            <h3>Why Choose BizRay?</h3>
            <div className="highlight-features">
              <div className="highlight-feature">
                <div className="feature-check">✓</div>
                <span>Completely free basic features</span>
              </div>
              <div className="highlight-feature">
                <div className="feature-check">✓</div>
                <span>EU directive compliant data handling</span>
              </div>
              <div className="highlight-feature">
                <div className="feature-check">✓</div>
                <span>Real-time data updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
