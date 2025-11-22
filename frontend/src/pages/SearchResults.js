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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();

    if (!q) {
      setLoading(false);
      setError(null);
      setCompanies([]);
      setHasSearched(false);
      setTotal(0);
      controller.abort();
      return;
    }

    if (q.length < 3) {
      setLoading(false);
      setError("Minimum search length is 3 characters");
      setCompanies([]);
      setHasSearched(false);
      setTotal(0);
      controller.abort();
      return;
    }

    setLoading(true);
    setError(null);
    setCompanies([]);
    setHasSearched(false);

    const url = `https://apibizray.bnbdevelopment.hu/api/v1/company?q=${encodeURIComponent(q)}&l=${limit}&p=${page}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        const results = data.results || data.companies || [];
        setCompanies(results);
        setTotal(data.total || 0);
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
  }, [q, page, limit]);


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

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
          <button
            key={pageNum}
            className={`pagination-button ${pageNum === page ? 'active' : ''}`}
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button
              className="pagination-button"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          className="pagination-button"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <section className="search-results">
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-title">
            Search results for <span className="search-query">"{q}"</span>
          </h1>
          <p className="search-results-count">
            {total} {total === 1 ? "company" : "companies"} found
            {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
          </p>
        </div>

        <div className="search-results-grid">
          {companies.map((company) => (
            <SearchResultCard key={company.firmenbuchnummer} company={company} />
          ))}
        </div>

        {renderPagination()}
      </div>
    </section>
  );
}
