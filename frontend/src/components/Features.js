import React from 'react';
import { Users, Network, Shield } from 'lucide-react';
import BackgroundNetwork from './BackgroundNetwork';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <Users size={36} />,
      title: "Company Details",
      description:
        "Gain full transparency into any business — from legal form and address to ownership and management structure.",
      highlight: "Full transparency",
    },
    {
      icon: <Network size={36} />,
      title: "Network Visualization",
      description:
        "Explore corporate relationships through interactive network graphs. Visualize to learn",
      highlight: "Enterprise-scale insights",
    },
    {
      icon: <Shield size={36} />,
      title: "Risk Assessment",
      description:
        "Assess financial and structural risk using interconnected data from partners, subsidiaries, and bankrupt entities.",
      highlight: "Real-time risk intelligence",
    },
  ];

  return (
    <section id="features" className="features-section">

      <div className="features-background">
        <BackgroundNetwork />
        
      </div>

      <div className="features-content">
        <div className="features-header">
          <h2 className="features-title">Core Capabilities</h2>
          <p className="features-subtitle">
            BizRay provides the essential tools for understanding companies, visualizing their networks,
            and evaluating risk in real time.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-body">
                <h3 className="feature-name">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <span className="feature-highlight">{feature.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
