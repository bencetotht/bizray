import "./Pricing.css";
import { Check, X, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import BackgroundNetwork from "../components/BackgroundNetwork";

export default function Pricing() {

  const privileges = [
    { name: "Company Details",      guest: "yes",     registered: "yes",     subscriber: "yes" },
    { name: "Search (basic)",       guest: "yes",     registered: "yes",     subscriber: "yes" },
    { name: "Network Visualization",guest: "no",      registered: "no",      subscriber: "yes" }, // paywall
    { name: "Usage Limits",         guest: "limited", registered: "limited", subscriber: "yes" },
  ];

  const renderCell = (status) => {
    if (status === "yes")   return <span className="pill pill-yes"><Check size={16} aria-hidden /> Included</span>;
    if (status === "no")    return <span className="pill pill-no"><X size={16} aria-hidden /> Not available</span>;
    return                    <span className="pill pill-limited"><Minus size={16} aria-hidden /> Limited</span>;
  };

  return (
    <section className="pricing-page">

      <div className="pricing-bg">
        <BackgroundNetwork />
        <div className="pricing-overlay" />
      </div>


      <div className="container">
        <div className="pricing-card-wrapper">
          <div className="pricing-card">
            <header className="pricing-header">
              <h1>Pricing & Plans</h1>
              <p className="subtitle">
                Start free with basic search and company details. Upgrade for the network view.
              </p>
            </header>

            <table className="pricing-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Privilege</th>
                  <th scope="col" className="tier-name">
                    <div className="tier-header guest">
                      Guest
                      <small>no sign-up</small>
                    </div>
                  </th>
                  <th scope="col" className="tier-name">
                    <div className="tier-header registered">
                      Registered
                      <small>free account</small>
                    </div>
                  </th>
                  <th scope="col" className="tier-name">
                    <div className="tier-header subscriber">
                      Subscriber
                      <small>full access</small>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {privileges.map((p, i) => (
                  <tr key={i}>
                    <th scope="row">{p.name}</th>
                    <td>{renderCell(p.guest)}</td>
                    <td>{renderCell(p.registered)}</td>
                    <td>{renderCell(p.subscriber)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="pricing-cta">
              <Link className="btn btn-ghost" to="/register">Create free account</Link>
              <Link className="btn btn-primary" to="/account#billing">Get network view</Link>
            </footer>

            <div className="pricing-note">
              <p>
                <strong>Note:</strong> “Limited” indicates reduced usage compared to Subscribers (e.g., lower daily request allowance). Exact limits may vary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
