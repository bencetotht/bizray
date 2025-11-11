import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Loader2, AlertCircle } from "lucide-react";
import SearchResultCard from "../components/SearchResultCard";
import "./SearchResults.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
  const query = useQuery();
  const q = (query.get("q") || "").trim();


  const [loading, setLoading] = useState(!!q);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    if (!q) {
      setLoading(false);
      setError(null);
      setCompanies([]);
      setHasSearched(false);
      controller.abort();
      return;
    }

    setLoading(true);
    setError(null);
    setCompanies([]);
    setHasSearched(false);

    const url = `https://apibizray.bnbdevelopment.hu/api/v1/company?q=${encodeURIComponent(q)}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        const results = data.results || data.companies || [];
        setCompanies(results);
        setHasSearched(true);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Unknown error");
          setHasSearched(true);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [q]);


  if (loading) {
    return (
      <section className="search-results">
        <div className="search-results-container">
          <div className="search-results-loading">
            <Loader2 size={32} className="spinner" />
            <p>Searching...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="search-results">
        <div className="search-results-container">
          <div className="search-results-error">
            <AlertCircle size={24} />
            <div>
              <h3>Error loading results</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!q) {
    return (
      <section className="search-results">
        <div className="search-results-container">
          <div className="search-results-empty">
            <Search size={48} />
            <h2>Start Your Search</h2>
            <p>Enter a search term to find companies</p>
          </div>
        </div>
      </section>
    );
  }

  if (hasSearched && !companies.length && !loading) {
    return (
      <section className="search-results">
        <div className="search-results-container">
          <div className="search-results-empty">
            <Search size={48} />
            <h2>No companies found</h2>
            <p>We couldn't find any companies matching "{q}"</p>
            <p className="search-results-suggestion">Try adjusting your search terms</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="search-results">
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-title">
            Search results for <span className="search-query">"{q}"</span>
          </h1>
          <p className="search-results-count">
            {companies.length} {companies.length === 1 ? "company" : "companies"} found
          </p>
        </div>

        <div className="search-results-grid">
          {companies.map((company) => (
            <SearchResultCard key={company.firmenbuchnummer} company={company} />
          ))}
        </div>
      </div>
    </section>
  );
}
