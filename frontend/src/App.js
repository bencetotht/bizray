import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import MainPage from "./pages/MainPage";
import AboutPage from "./pages/AboutPage"
import CompanyDetails from "./pages/CompanyDetails"
import Pricing from "./pages/Pricing"
import FeaturesPage from "./pages/Features_Page";
import Services from "./pages/Services";
import SearchResults from "./pages/SearchResults";
import SearchPage from "./pages/SearchPage"
import SearchResponsePage from "./pages/SearchResponsePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import GraphWrapper from "./components/layouts/GraphWrapper"
import "./index.css";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/search_page" element={<SearchPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/response" element={<SearchResponsePage />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/company/:id" element={<CompanyDetails />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/graph/:id" element={<GraphWrapper/>}/>

         
          <Route path="*" element={<div style={{padding:'1rem'}}><h1>404</h1></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

