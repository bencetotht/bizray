import React, { useState } from "react";
import { Search, Menu, X, User, LogIn } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const closeMenu = () => setIsMenuOpen(false);

  const submitSearch = () => {
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
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search companies..."
                  className={`search-input ${error ? "search-input-error" : ""}`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (error) setError(""); // Clear error when user types
                  }}
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
              {error && <div className="search-error">{error}</div>}
            </div>

            <div className="auth-buttons">
              <button className="btn btn-secondary"><LogIn size={16} />Login</button>
              <button className="btn btn-primary"><User size={16} />Sign Up</button>
            </div>

            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;












// import React, { useState } from 'react';
// import { Search, Menu, X, User, LogIn } from 'lucide-react';
// import './Header.css';

// const Header = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   return (
//     <header className="header">
//       <div className="container">
//         <div className="header-content">
//           <div className="logo">
//             <span className="logo-text">BizRay</span>
//             <span className="logo-tagline">X-Ray for Business</span>
//           </div>

//           <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
//             <a href="#features" className="nav-link">Features</a>
//             <a href="#services" className="nav-link">Services</a>
//             <a href="#pricing" className="nav-link">Pricing</a>
//             <a href="#about" className="nav-link">About</a>
//           </nav>

//           <div className="header-actions">
//             <div className="search-container">
//               <Search className="search-icon" size={20} />
//               <input 
//                 type="text" 
//                 placeholder="Search companies..." 
//                 className="search-input"
//               />
//             </div>
            
//             <div className="auth-buttons">
//               <button className="btn btn-secondary">
//                 <LogIn size={16} />
//                 Login
//               </button>
//               <button className="btn btn-primary">
//                 <User size={16} />
//                 Sign Up
//               </button>
//             </div>

//             <button 
//               className="menu-toggle"
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//             >
//               {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
