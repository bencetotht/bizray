



import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import MainPage from "./pages/MainPage";
import AboutPage from "./pages/AboutPage"
import CompanyDetails from "./pages/CompanyDetails"
import Pricing from "./pages/Pricing"
import Features_Page from "./pages/Features_Page";
import Services from "./pages/Services";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/features" element={<Features_Page />} />
          <Route path="/services" element={<Services />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/company_details" element={<CompanyDetails />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* optional 404: */}
          <Route path="*" element={<div style={{padding:'1rem'}}><h1>404</h1></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

























// import React from 'react';
// import './App.css';
// import Header from './components/Header';
// import Hero from './components/Hero';
// import Features from './components/Features';
// import HowItWorks from './components/HowItWorks';
// import Stats from './components/Stats';
// import Footer from './components/Footer';

// function App() {
//   return (
//     <div className="App">
//       <Header />
//       <Hero />
//       <Features />
//       <HowItWorks />
//       <Stats />
//       <Footer />
//     </div>
//   );
// }

// export default App;
