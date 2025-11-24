import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import "./RiskIndicators.css";

Chart.register(ArcElement, Tooltip, Legend);


const riskConfig = {
  debt_to_equity_ratio: {
    label: "Debt to Equity Ratio",
    type: "numeric",
    color: (v) => (v > 0.6 ? "var(--red)" : v > 0.4 ? "var(--yellow)" : "var(--green)"),
    tooltip: "Shows how much the company relies on borrowed money versus its own capital. A lower ratio means the company is less dependent on debt, indicating better long-term financial stability.",
  },
  cash_ratio: {
    label: "Cash Ratio",
    type: "numeric",
    color: (v) => (v < 0.5 ? "var(--red)" : v <= 1 ? "var(--yellow)" : "var(--green)"),
    tooltip: "Measures whether the company has enough cash on hand to pay its immediate debts. A ratio above 1.0 means strong liquidity - the company can cover all short-term obligations with cash.",
  },
  debt_to_assets: {
    label: "Debt to Assets",
    type: "numeric",
    color: (v) => (v > 0.6 ? "var(--red)" : v > 0.4 ? "var(--yellow)" : "var(--green)"),
    tooltip: "Shows what percentage of the company's assets were purchased using borrowed money. Lower percentages indicate the company owns more of its assets outright, which is generally safer.",
  },
  equity_ratio: {
    label: "Equity Ratio",
    type: "numeric",
    color: (v) => (v > 0.5 ? "var(--green)" : v >= 0.3 ? "var(--neutral)" : "var(--yellow)"),
    tooltip: "Indicates how much of the company's assets are funded by the owners' own money rather than debt. Higher percentages (above 50%) show strong financial independence and stability.",
  },
  concentration_risk: {
    label: "Concentration Risk",
    type: "numeric",
    color: (v) => (v > 0.3 ? "var(--red)" : v >= 0.15 ? "var(--yellow)" : "var(--neutral)"),
    tooltip: "Reveals hidden risk from deals with related companies. If this is high (above 30%), it means a large portion of assets are IOUs from affiliated companies, which could be risky if those companies fail.",
  },
  deferred_income_risk: {
    label: "Deferred Income Reliance",
    type: "boolean",
    color: (v) => (v ? "var(--red)" : "var(--green)"),
    text: (v) => (v ? "High Risk" : "Not High Risk"),
    tooltip: "Flags if the company is overly dependent on customer prepayments for products or services not yet delivered. High reliance can be risky if the company can't fulfill these obligations.",
  },
  compliance_status: {
    label: "Compliance Status",
    type: "boolean",
    color: (v) => (v ? "var(--green)" : "var(--red)"),
    text: (v) => (v ? "Compliant" : "Not Compliant"),
    tooltip: "Shows whether the company has filed all required financial reports and regulatory paperwork on time. Missing filings can indicate organizational problems or attempts to hide information.",
  },
  irregular_fiscal_year: {
    label: "Irregular Fiscal Year",
    type: "boolean",
    color: (v) => (v ? "var(--red)" : "var(--green)"),
    text: (v) => (v ? "Irregular" : "Normal"),
    tooltip: "A shortened or unusual fiscal year often signals major changes like mergers, acquisitions, bankruptcies, or restructuring. These events can significantly impact the company's financial stability.",
  },
  balance_sheet_volatility_score: {
    label: "Balance Sheet Volatility Score",
    type: "numeric",
    color: (v) => (v > 0.8 ? "var(--red)" : v > 0.5 ? "var(--yellow)" : "var(--green)"),
    tooltip: "Detects extreme changes in company size over one year. Scores above 0.8 indicate dramatic growth or shrinkage, which may signal instability, aggressive expansion, or financial distress requiring closer examination.",
  },
};


const NumericPill = ({ value, colorFn }) => {
  const isNa = value === null || value === undefined;
  const v = isNa ? 0 : Math.max(0, Math.min(1, Number(value)));

  return (
    <div className={`pill ${isNa ? "pill-na" : ""}`}>
      <div className="pill-gradient-bg" />
      
      <div className="pill-track">
        <div className="pill-segment"></div>
        <div className="pill-segment"></div>
        <div className="pill-segment"></div>
        <div className="pill-segment"></div>
      </div>

      <div
        className="pill-fill"
        style={{
          width: `${(1 - v) * 100}%`,
        }}
      />

      <div className="pill-label">
        {isNa ? "N/A" : `${(v * 100).toFixed(1)}%`}
      </div>
    </div>
  );
};


const BooleanPill = ({ value, colorFn, textFn }) => {
  const isNa = value === null || value === undefined;

  const backgroundColor = isNa ? "#dfe3e6" : colorFn(value);
  const label = isNa ? "N/A" : textFn(value);

  return (
    <div className={`pill pill-boolean ${isNa ? "pill-na" : ""}`}>
      <div 
        className="pill-boolean-fill"
        style={{ background: backgroundColor }}
      />
      <div className="pill-label-boolean">{label}</div>
    </div>
  );
};


const RiskPiechart = ({ score }) => {
  const normalizedScore = Number(score ?? 0);
  const pct = (normalizedScore * 100).toFixed(1);

  const chartData = useMemo(() => ({
    datasets: [
      {
        data: [normalizedScore * 100, 100 - (normalizedScore * 100)],
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return ["#667eea", "#e5e7eb"];
          
          const grad = c.createLinearGradient(
            chartArea.left, chartArea.top,
            chartArea.right, chartArea.bottom
          );
          
          grad.addColorStop(0, "#667eea");
          grad.addColorStop(1, "#764ba2");

          return [grad, "#e5e7eb"];
        },
        borderWidth: 0,
        hoverOffset: 0,
        hoverBackgroundColor: ctx => ctx.dataset.backgroundColor,
      },
    ],
  }), [normalizedScore]);

  const chartOptions = useMemo(() => ({
    cutout: "72%",
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    maintainAspectRatio: false,
    hover: { mode: null },
    animation: { duration: 650, easing: "easeOutQuart" }
  }), []);

  return (
    <div className="risk-pie">
      <div className="risk-pie-chart full">
        <Doughnut
          data={chartData}
          options={chartOptions}
          aria-label={`Risk score: ${pct}%`}
          role="img"
        />

        <div className="risk-pie-center">
          <div className="risk-pie-center-text">
            <span className="risk-pie-percent">{pct}%</span>
            <span className="risk-pie-center-label">risk score</span>
          </div>
        </div>
      </div>

      <div className="risk-pie-caption">
        Overall Risk
        <button 
          className="risk-label-tooltip" 
          type="button"
          aria-label="Overall risk explanation"
        >
          ?
          <span className="risk-label-tooltip-text" role="tooltip">
            This score combines all financial and operational risk indicators into a single percentage. 
            0% represents minimal risk (strong financial health), while 100% indicates maximum risk. 
            Use this as a quick health check, but review individual indicators for detailed insights.
          </span>
        </button>
      </div>
    </div>
  );
};


const RISK_KEYS = [
  "debt_to_equity_ratio",
  "cash_ratio",
  "debt_to_assets",
  "equity_ratio",
  "concentration_risk",
  "deferred_income_risk",
  "compliance_status",
  "irregular_fiscal_year",
  "balance_sheet_volatility_score",
];


export default function RiskIndicators({ indicators, riskScore }) {
  return (
    <div className="risk-ui">
      <RiskPiechart score={riskScore} />

      <div className="risk-columns">
        {RISK_KEYS.map((key) => {
          const cfg = riskConfig[key];
          const value = indicators[key];

          return (
            <div className="risk-row" key={key}>
              <span className="risk-label">
                {cfg.label}
                <button 
                  className="risk-label-tooltip" 
                  type="button"
                  aria-label={`${cfg.label} explanation`}
                >
                  ?
                  <span className="risk-label-tooltip-text" role="tooltip">
                    {cfg.tooltip}
                  </span>
                </button>
              </span>
              {value === null || value === undefined ? (
                <NumericPill value={null} colorFn={() => "#dfe3e6"} />
              ) : cfg.type === "numeric" ? (
                <NumericPill value={value} colorFn={cfg.color} />
              ) : (
                <BooleanPill value={value} colorFn={cfg.color} textFn={cfg.text} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
