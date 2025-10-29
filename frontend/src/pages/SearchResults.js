import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./MainPage.css"; // reuse container styles; adjust if you prefer a dedicated css

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
    return <div style={{ padding: "1rem" }}>Please enter a search term.</div>;
  }

  return (
    <section className="search-results">
      <div className="container">
        <h1>Search results for “{q}”</h1>
        {loading && <p>Loading…</p>}
        {error && <p className="error">Error: {error}</p>}
        {!loading && !error && companies.length === 0 && (
          <p>No companies found for “{q}”.</p>
        )}
        <ul className="company-list">
          {companies.map((c) => (
            <li key={c.firmenbuchnummer} className="company-list-item">
              <h3>{c.name}</h3>
              <p>
                {c.seat} — {c.legal_form}
              </p>
              <p>Firmenbuchnummer: {c.firmenbuchnummer}</p>
              <p>Risk score: {c.riskScore ?? "N/A"}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
