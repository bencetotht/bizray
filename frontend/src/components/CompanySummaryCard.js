// src/components/CompanySummaryCard.js
import { Landmark, FileText, MapPin } from "lucide-react";
import React from "react";

export default function CompanySummaryCard({ company }) {
  const { firmenbuchnummer, legal_form, business_purpose, seat } = company;

  return (
    <div className="company-details-content">
      <div className="detail-row">
        <Landmark size={18} />
        <span><strong>Legal form:</strong> {legal_form}</span>
      </div>
      <div className="detail-row">
        <FileText size={18} />
        <span><strong>Business purpose:</strong> {business_purpose}</span>
      </div>
      <div className="detail-row">
        <MapPin size={18} />
        <span><strong>Seat:</strong> {seat}</span>
      </div>
      <div className="detail-row">
        <span className="firmenbuchnummer">
          Firmenbuchnummer: {firmenbuchnummer}
        </span>
      </div>
    </div>
  );
}
