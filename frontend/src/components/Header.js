import React, { useState } from "react";
import { Search, Menu, X, User, LogIn } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const closeMenu = () => setIsMenuOpen(false);
  const { user, isAuthenticated, loadingUser, logout } = useAuth();

  // Add this console.log to debug
  console.log("Header - isAuthenticated:", isAuthenticated, "loadingUser:", loadingUser, "user:", user);


  const submitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
 
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => window.location.href = "/" } style={{cursor: "pointer"}}>
            <span className="logo-text">BizRay</span>
            <span className="logo-tagline">X-Ray for Business</span>
          </div>

          <nav className={`nav ${isMenuOpen ? "nav-open" : ""}`}>
            {/* <NavLink to="/" className="nav-link" onClick={closeMenu}>Main Page</NavLink> */}
   
            <NavLink to="/features" className="nav-link" onClick={closeMenu}>Features</NavLink>
            <NavLink to="/about" className="nav-link" onClick={closeMenu}>About</NavLink>
            <NavLink to="/pricing" className="nav-link" onClick={closeMenu}>Pricing</NavLink>
          </nav>


          <div className="header-actions">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search companies..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
              />
              <button
                type="button"
                className="search-btn"
                onClick={submitSearch}
                aria-label="Search"
              >
                Search
              </button>
            </div>

            {!isAuthenticated ? <div className="auth-buttons">
              
              <NavLink to="/login" className="btn btn-secondary"><LogIn size={16} />Login</NavLink>
              <NavLink to="/register" className="btn btn-primary"><User size={16} />Sign Up</NavLink>
            </div> : <div className="auth-buttons">
              
              <NavLink to="/account" className="btn btn-primary"><User size={16} />{user.username}</NavLink>
            </div>
            
          }





            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}></div>
      )}

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? "mobile-menu-open" : ""}`}>
        <div className="mobile-menu-content">
          <nav className="mobile-nav">
            <NavLink to="/features" className="mobile-nav-link" onClick={closeMenu}>
              <span>Features</span>
            </NavLink>
            <NavLink to="/about" className="mobile-nav-link" onClick={closeMenu}>
              <span>About</span>
            </NavLink>
            <NavLink to="/pricing" className="mobile-nav-link" onClick={closeMenu}>
              <span>Pricing</span>
            </NavLink>
          </nav>

          <div className="mobile-search-container">
            <div className="mobile-search-wrapper">
              <Search className="mobile-search-icon" size={20} />
              <input
                type="text"
                placeholder="Search companies..."
                className="mobile-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
              />
            </div>
            <button
              type="button"
              className="mobile-search-btn"
              onClick={submitSearch}
              aria-label="Search"
            >
              <Search size={18} />
              Search
            </button>
          </div>

          <div className="mobile-auth-buttons">

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

