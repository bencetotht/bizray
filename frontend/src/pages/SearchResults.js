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
  const q = query.get("q") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    if (!q.trim()) {
      setCompanies([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const url = `https://apibizray.bnbdevelopment.hu/api/v1/company?q=${encodeURIComponent(q)}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        setCompanies(data.companies || []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [q]);

  if (!q.trim()) {
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

  return (
    <section className="search-results">
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-title">
            Search results for <span className="search-query">"{q}"</span>
          </h1>
          {companies.length > 0 && (
            <p className="search-results-count">
              {companies.length} {companies.length === 1 ? "company" : "companies"} found
            </p>
          )}
        </div>

        {loading && (
          <div className="search-results-loading">
            <Loader2 size={32} className="spinner" />
            <p>Searching...</p>
          </div>
        )}

        {error && (
          <div className="search-results-error">
            <AlertCircle size={24} />
            <div>
              <h3>Error loading results</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && companies.length === 0 && (
          <div className="search-results-empty">
            <Search size={48} />
            <h2>No companies found</h2>
            <p>We couldn't find any companies matching "{q}"</p>
            <p className="search-results-suggestion">Try adjusting your search terms</p>
          </div>
        )}

        {!loading && !error && companies.length > 0 && (
          <div className="search-results-grid">
            {companies.map((company) => (
              <SearchResultCard key={company.firmenbuchnummer} company={company} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
