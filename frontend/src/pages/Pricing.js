

import './Pricing.css';
import { Check, X } from 'lucide-react';

export default function Pricing(){
    const privileges = [
        { name: "Company Details", guest: true, registered: true, subscriber: true },
        { name: "Network Visualization", guest: true, registered: true, subscriber: true },
        { name: "Risk Assessment", guest: true, registered: true, subscriber: true },
        { name: "Search Functionality", guest: true, registered: true, subscriber: true },
        { name: "Basic Analytics", guest: true, registered: true, subscriber: true },
        { name: "PDF/CSV Export", guest: false, registered: true, subscriber: true },
        { name: "Higher limit for data access", guest: false, registered: true, subscriber: true },
        { name: "Custom Report Builder", guest: false, registered: false, subscriber: true },
        { name: "Advanced Analytics", guest: false, registered: false, subscriber: true },
        { name: "Priority Support", guest: false, registered: false, subscriber: true },
    ];

    const renderPrivilege = (hasAccess, isLimited = false) => {
        if (isLimited) {
            return <span className="limited">Limited</span>;
        }
        return hasAccess
            ? <span className="check" aria-label="Available"><Check size={16} aria-hidden="true" /></span>
            : <span className="cross" aria-label="Unavailable"><X size={16} aria-hidden="true" /></span>;
    };

    return (
        <section className="pricing-page-section">
            <div className="container">
                <div className="pricing-card-wrapper">
                    <div className="pricing-card">
                        <h1>Pricing & Plans</h1>
                        <p className="subtitle">
                            Choose the plan that fits your needs. All tiers include access to our open company data.
                        </p>
                        
                        <table className="pricing-table">
                            <thead>
                                <tr>
                                    <th>Privilege</th>
                                    <th className="tier-name">
                                        <div className="tier-header guest">Guest</div>
                                    </th>
                                    <th className="tier-name">
                                        <div className="tier-header registered">Registered Users</div>
                                    </th>
                                    <th className="tier-name">
                                        <div className="tier-header subscriber">Subscribers</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {privileges.map((privilege, index) => (
                                    <tr key={index}>
                                        <td>{privilege.name}</td>
                                        <td>{renderPrivilege(privilege.guest)}</td>
                                        <td>{renderPrivilege(privilege.registered)}</td>
                                        <td>{renderPrivilege(privilege.subscriber)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    )
}


