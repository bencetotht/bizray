# Values

## General Information
- Fiscal Year
- Currency (e.g., EUR)

## Assets (Aktiva - § 224 Abs. 2)
- Total Assets
    - A. Fixed Assets (Anlagevermögen)
        - I. Intangible Assets (Immaterielle Vermögensgegenstände)
        - II. Tangible Assets (Sachanlagen)
        - III. Financial Assets (Finanzanlagen)
    - B. Current Assets (Umlaufvermögen)
        - I. Inventories (Vorräte)
        - II. Receivables and Other Assets (Forderungen...)
        - III. Securities (Wertpapiere)
        - IV. Cash and Cash Equivalents (Kassenbestand...)
    - C. Prepaid Expenses (Rechnungsabgrenzungsposten)
    - D. Active Deferred Taxes (Aktive latente Steuern)

## Liabilities & Equity (Passiva - § 224 Abs. 3)
- Total Liabilities and Equity
    - A. Equity (Eigenkapital)
        - I. Subscribed Capital (Nennkapital)
        - II. Capital Reserves (Kapitalrücklagen)
        - III. Revenue Reserves (Gewinnrücklagen)
        - IV. Net Profit/Loss (Bilanzgewinn/Verlust)
    - C. Liabilities (Verbindlichkeiten)
    - D. Deferred Income (Rechnungsabgrenzungsposten)
    - E. Passive Deferred Taxes (Passive latente Steuern)

## Notes
- Accounting and Valuation Principles
- Foreign Currency Translation
- Contingent Liabilities / Guarantees
- Average Number of Employees
- Information on Deferred Taxes

# Value Template
```json
{
  "assets": {
    "total_assets": 4760563481.15,
    "fixed_assets": 1565094949.41,
    "intangible_assets": 28256736.94,
    "tangible_assets": 398153165.89,
    "financial_assets": 1138685046.58,
    "current_assets": 3147407832.25,
    "inventories": 111383265.91,
    "receivables_and_other_assets": 2749692806.52,
    "securities": 0.0,
    "cash_and_cash_equivalents": 286331759.82,
    "prepaid_expenses": 48060699.49,
    "active_deferred_taxes": 0.0
  },
  "liabilities_equity": {
    "total_liabilities_and_equity": 4760563481.15,
    "equity": 4272448952.01,
    "subscribed_capital": 36336.42,
    "capital_reserves": 0.0,
    "revenue_reserves": 100003633.64,
    "net_profit_loss": 4172408981.95,
    "liabilities": 130778342.78,
    "deferred_income": 356628627.62,
    "passive_deferred_taxes": 707558.74
  },
  "currency": "EUR",
  "notes": {
    "accounting_and_valuation_principles": null,
    "foreign_currency_translation": null,
    "contingent_liabilities_guarantees": null,
    "average_number_of_employees": null,
    "information_on_deferred_taxes": null
  }
}
```

# Risk Indicators

## 1. Balanced Sheet Indicators
> These indicators provide a snapshot of a company’s financial health at a specific point in time by analyzing its balance sheet. Fundamental in assessing a company’s ability to meet its short-term and long-term obligations
- **Working Capital: Low priority - no priority**
    - The difference between a company's current assets (cash, inventory etc.) and its current liabilities (accounts payable, short-term debts). In short, another way to check if a company can pay its short-term bills
    - Not to implement: its calculation (Current Assets – Current Liabilities) requires specific line items from the balance sheet. Better to focus on Current Ratio because it provides a similar insight in a standardized, comparable format => better to build one good feature instead of multiple confusing ones
- **Dept-to-Equity-Ratio: High Priority**
    - Simple terms: “How much of the company is funded by borrowed money vs. the owners’ own money?” = Long-Term Health
    - Good (Green): 0.0 – 0.4
    - Warning (Yellow): 0.41 – 0.6
    - High Risk (Red): > 0.6
    - If null: Display "N/A".  (it's just examples for better understanding)
- **Cash Ratio (High Prioroty, Liquidity)**
    - The company's short-term survival capability. A ratio showing if the company has enough immediate cash to cover its debts.
    - Good (Green): > 1.0 (More cash than debt)
    - Warning (Yellow): 0.5 – 1.0
    - High Risk (Red): < 0.5 (Less than half the cash needed)
    - If null: Display "N/A".
 - **Debt to Assets**
    - A simple leverage ratio showing what percentage of the company's total assets were financed by debt.
    - What you receive: A number (float) representing the ratio (e.g., 0.45), or null
    - Good (Green): < 0.4 (Less than 40%)
    - Warning (Yellow): 0.4 – 0.6 (40% - 60%)
    - High Risk (Red): > 0.6 (More than 60%)
    - If null: Display "N/A".
- **Equity Ratio**
    - The inverse of the debt ratio; it shows what percentage of assets are funded by the owners' own capital. A high number is a strong sign of financial stability.
    - Strong (Green): > 0.5 (More than 50%)
    - Okay (No color): 0.3 – 0.5 (30% - 50%)
    - Weak (Yellow): < 0.3 (Less than 30%)
    - If null: Display "N/A".
- **Concentration Risk**
    - A special indicator that checks for "hidden" network risk within the balance sheet. It measures the percentage of a company's total assets that are just IOUs from its own related/affiliated companies.
    - A higher number is a bigger risk.
    - Low (No color): < 15
    - Warning (Yellow): 15 – 30
    - High Risk (Red): > 30 (If over 30% of assets are internal IOUs, display this prominently).
    - If null: Display "N/A".
- **Deferred Income Risk**
    - A simple flag that turns true if the company is dangerously reliant on customer prepayments (money for work it hasn't done yet) for its funding.
    - If true: it's a High Risk.
    - If false or null: not a high risk, can be shown or not.


## 2. Trend Indicators
- **Compliance (check_compliance_status() High Prioroty)**
    - A flag indicating if the company is up-to-date with its mandatory paperwork.
    - If true: is compliant, safe.
    - If false: red flag, not compliant.
    - If null: unkown.
- **Irregular Year (High Priority)**
    - A flag for a "short fiscal year," which signals a major, disruptive event (merger, acquisition, etc.).
    - True: It's an irregular fiscal year, red flag
    - False: normal fiscal year, safe
- **Balance Sheet Volatility Score (High Prioroty)**
    - A risk score from 0.0 to 1.0 that flags extreme, rapid changes in the company's size in one year.
    - A value > 0.8 should be considered a warning, indicating very high growth/shrinkage that warrants attention.
    - If null: Display "N/A".
    - This indicator depends on receiving previous year data from the API. If that data is missing, the value will be null
- **Blocked Trend Indicators**
    - Company Growth (Revenue) and Operational Result (Profit): These are planned but currently blocked until the backend can access multi-year historical data from the API. Do not build UI for these yet.



## 3. Network Risk
- **High Priority**
- Checks the connections the company has
- Core idea, a company can look perfectly healthy, but if its network of partners companies is collapsing, it’s a high risk of being dragged down with them
