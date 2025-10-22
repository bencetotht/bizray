import React from 'react';
import { Search, Eye, Network, CheckCircle, ArrowRight } from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: <Search size={24} />,
      title: "Search",
      description: "Enter the company name, address, or a related person's name in the search field.",
      details: "Automatic focus on the search field on page load for ease of use."
    },
    {
      number: "02", 
      icon: <Eye size={24} />,
      title: "Analysis",
      description: "The system immediately displays the company's basic information and risk indicators.",
      details: "Get complete company profile information within 3 seconds."
    },
    {
      number: "03",
      icon: <Network size={24} />,
      title: "Network Discovery",
      description: "Discover the company's connections, subsidiaries, and shared executives.",
      details: "Visualization of influence networks analyzed using PageRank algorithm."
    },
    {
      number: "04",
      icon: <CheckCircle size={24} />,
      title: "Decision",
      description: "Make informed decisions based on reliability and risk assessment.",
      details: "Export results for documentation or further analysis."
    }
  ];

  const useCases = [
    {
      role: "Customer",
      scenario: "A customer checks if a company actually exists before placing an order.",
      icon: "👤"
    },
    {
      role: "Supplier", 
      scenario: "A supplier checks if a potential partner has any bankrupt connections.",
      icon: "🏢"
    },
    {
      role: "Sibling Company",
      scenario: "A sibling company verifies if they share executives with another entity.",
      icon: "🤝"
    },
    {
      role: "Administrator",
      scenario: "An administrator reviews logs and updates the database via API.",
      icon: "⚙️"
    }
  ];

  return (
    <section id="how-it-works" className="section how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Discover the world of companies and make informed decisions in four simple steps.
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <div className="step-icon">
                  {step.icon}
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                <p className="step-details">{step.details}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="step-arrow">
                  <ArrowRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="use-cases">
          <h3 className="use-cases-title">Real Use Cases</h3>
          <div className="use-cases-grid">
            {useCases.map((useCase, index) => (
              <div key={index} className="use-case-card">
                <div className="use-case-icon">{useCase.icon}</div>
                <h4 className="use-case-role">{useCase.role}</h4>
                <p className="use-case-scenario">{useCase.scenario}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
