import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, Github, Linkedin, Twitter } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-text">BizRay</span>
              <span className="logo-tagline">X-Ray for Business</span>
            </div>
            <p className="footer-description">
              Business transparency for everyone. Discover the world of companies, 
              assess risks, and make informed decisions based on open data.
            </p>
            <div className="footer-links">
              <a href="https://www.data.gv.at/datasets/e91bd464-be86-453c-b693-2ab818e11df2?locale=en" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="footer-link">
                <ExternalLink size={16} />
                data.gv.at
              </a>
                <a href="https://justizonline.gv.at/jop/web/iwg" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="footer-link">
                <ExternalLink size={16} />
                API Documentation
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Features</h4>
            <ul className="footer-list">
              <li><a href="#search">Company Search</a></li>
              <li><a href="#network">Network Visualization</a></li>
              <li><a href="#risk">Risk Assessment</a></li>
              <li><a href="#export">Data Export</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Use Cases</h4>
            <ul className="footer-list">
              <li><a href="#customer">Customer Verification</a></li>
              <li><a href="#supplier">Supplier Risk</a></li>
              <li><a href="#partnership">Partner Assessment</a></li>
              <li><a href="#research">Research & Analysis</a></li>
              <li><a href="#compliance">Compliance</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Contact</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={16} />
                <span>info@bizray.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+43 660 1234567</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>Krems an der Donau, Austria</span>
              </div>
            </div>
            <div className="social-links">
              <a href="#" className="social-link">
                <Github size={20} />
              </a>
              <a href="#" className="social-link">
                <Linkedin size={20} />
              </a>
              <a href="#" className="social-link">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2025 BizRay. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
