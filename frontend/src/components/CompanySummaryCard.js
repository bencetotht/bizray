// src/components/CompanySummaryCard.js
import { Landmark, FileText, MapPin } from "lucide-react";
import React from "react";

//render empty string for missing values
const displayValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return value;
};

export default function CompanySummaryCard({ company }) {
  const { firmenbuchnummer, legal_form, business_purpose, seat } = company || {};

  return (
    <div className="company-details-content">
      <div className="detail-row">
        <Landmark size={18} />
        <span><strong>Legal form:</strong> {displayValue(legal_form)}</span>
      </div>
      <div className="detail-row">
        <FileText size={18} />
        <span><strong>Business purpose:</strong> {displayValue(business_purpose)}</span>
      </div>
      <div className="detail-row">
        <MapPin size={18} />
        <span><strong>Seat:</strong> {displayValue(seat)}</span>
      </div>
      <div className="detail-row">
        <span className="firmenbuchnummer">
          Firmenbuchnummer: {displayValue(firmenbuchnummer)}
        </span>
      </div>
    </div>
  );
}
