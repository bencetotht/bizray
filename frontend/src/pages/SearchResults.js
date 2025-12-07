import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import { FormControl, Select, MenuItem } from "@mui/material";
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
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Reset page to 1 when search query changes or city filter changes
  useEffect(() => {
    setPage(1);
  }, [q, selectedCities]);

useEffect(() => {
  const controller = new AbortController();

  setSelectedCities([]);
  setCities([]);

  if (!q || q.length < 3) {
    controller.abort();
    return;
  }

  setLoadingCities(true);

  const url = `https://apibizray.bnbdevelopment.hu/api/v1/cities?q=${encodeURIComponent(q)}`;

  fetch(url, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    })
    .then((data) => {
      const fetchedCities = data.cities || [];
  
      const sortedCities = fetchedCities.sort((a, b) => {
        if (a.city === "Wien") return -1;
        if (b.city === "Wien") return 1;
        
        return a.city.localeCompare(b.city);
      });

      setCities(sortedCities);
      setLoadingCities(false);
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Error fetching cities:", err);
        setLoadingCities(false);
      }
    });

  return () => controller.abort();
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

    let url = `https://apibizray.bnbdevelopment.hu/api/v1/company?q=${encodeURIComponent(q)}&l=${limit}&p=${page}`;
    selectedCities.forEach(city => {
      url += `&city=${encodeURIComponent(city)}`;
    });

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
  }, [q, page, limit, selectedCities]);


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
            {selectedCities.length > 0 && (
              <p>in {selectedCities.join(", ")}</p>
            )}
            <p className="search-results-suggestion">Try adjusting your search terms or filters</p>
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

  const handleCityChange = (event) => {
    const value = event.target.value;
    if (value.includes("all")) {
      setSelectedCities([]);
    } else {
      setSelectedCities(value);
    }
  };

  const handleClearFilters = () => {
    setSelectedCities([]);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // const pages = [];
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
        {cities.length > 0 && (
          <div className="city-filter-container">
            <FormControl 
              className="city-filter" 
              variant="outlined" 
              size="small"
              disabled={loadingCities}
            >
              <Select
                multiple
                value={selectedCities}
                onChange={handleCityChange}
                displayEmpty
                renderValue={() => (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SlidersHorizontal size={16} />
                    Filter by City
                  </span>
                )}
                className={selectedCities.length > 0 ? 'has-filters' : ''}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 350,
                    },
                  },
                  disableAutoFocusItem: true,
                }}
              >
                <MenuItem value="all">
                  <div className="city-menu-item">
                    <input
                      type="checkbox"
                      checked={selectedCities.length === 0}
                      readOnly
                      className="city-checkbox"
                    />
                    <span className="city-name">All Cities</span>
                    <span className="city-count">{cities.reduce((sum, city) => sum + city.count, 0)}</span>
                  </div>
                </MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city.city} value={city.city}>
                    <div className="city-menu-item">
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city.city)}
                        readOnly
                        className="city-checkbox"
                      />
                      <span className="city-name">{city.city}</span>
                      <span className="city-count">{city.count}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCities.length > 0 && (
              <button 
                className="clear-filters-btn"
                onClick={handleClearFilters}
              >
                Clear Filter
              </button>
            )}
          </div>
        )}

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
