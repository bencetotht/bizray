import React from 'react';
import { Users, Network, Shield, Download, BarChart3, Eye } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <Users size={32} />,
      title: "Company Details",
      description: "Complete company profile: address, contact information, key people, and legal status information.",
      highlight: "Full transparency"
    },
    {
      icon: <Network size={32} />,
      title: "Network Visualization",
      description: "Interactive map of company relationships. Influence networks analyzed using PageRank algorithm.",
      highlight: "Up to 1000 nodes"
    },
    {
      icon: <Shield size={32} />,
      title: "Risk Assessment",
      description: "Individual and network risk indicators. Based on bankrupt connections and influence scores.",
      highlight: "Real-time"
    },
    {
      icon: <Download size={32} />,
      title: "Data Export",
      description: "Download and share company summaries. API access and bulk data management.",
      highlight: "2TB+ data"
    },
    {
      icon: <BarChart3 size={32} />,
      title: "Analytics Tools",
      description: "Detailed reports and statistics. Research datasets and visualizations.",
      highlight: "Professional"
    },
    {
      icon: <Eye size={32} />,
      title: "Transparency",
      description: "Easy access and interpretation of open company data for everyone, not just investors.",
      highlight: "EU HVD compatible"
    },
  ];

  return (
    <section id="features" className="section features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">
            Everything you need to understand who you're doing business with. 
            Transparent, reliable, and easy-to-use business intelligence.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-highlight">{feature.highlight}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="features-cta">
          <h3>Ready to explore the business world?</h3>
          <p>Join thousands of users who are already making more transparent decisions.</p>
          <div className="cta-buttons">
            <button className="btn btn-primary">Get Started Now</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
