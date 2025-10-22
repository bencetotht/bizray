# Risk Indicators

## 1. Balanced Sheet Indicators
> These indicators provide a snapshot of a company’s financial health at a specific point in time by analyzing its balance sheet. Fundamental in assessing a company’s ability to meet its short-term and long-term obligations
- **Working Capital: Low priority - no priority**
    - The difference between a company's current assets (cash, inventory etc.) and its current liabilities (accounts payable, short-term debts). In short, another way to check if a company can pay its short-term bills
    - Not to implement: its calculation (Current Assets – Current Liabilities) requires specific line items from the balance sheet. Better to focus on Current Ratio because it provides a similar insight in a standardized, comparable format => better to build one good feature instead of multiple confusing ones
- **Dept-to-Equity-Ratio: High Priority**
    - Simple terms: “How much of the company is funded by borrowed money vs. the owners’ own money?” = Long-Term Health
    - Huge red flag for risk, classic warning sign -> tells users that the company relies heavily on loans to operate 
    - You can calculate this ratio if the free government data gives the two numbers from a company’s balance sheet ( Total Liabilities = total dept, and Shareholders’ Equity = the owner’s stake)
- **Leverage Ratios: Medium Priority?**
    - Measures the same basic thing: How much a company relies on borrowed money
    - However, the Dept-to-Equity-Ratio already covers that so we can keep it simple and not include more leverage ratios. Not including it would be clear and effective. If we include it’ll show 3 different “leverage ratios" with slightly different numbers which can confuse the user
- **Liquidity Ratios: High Priority (But only if we have the data)**
    - = short-term survival (checks if the company has enough cash (or things it can sell quickly) to pay employees, suppliers and rent for the next few months)

## 2. Trend Indicators
- **Company Growth: High Priority**
    - Checks if the company’s business is getting bigger or smaller
    - Tracks the revenue over the last 3-5 years
    - Depends on the historical data available
- **Operational Result Over Time: High Priority**
    - Checks if the company is getting better or worse at making profit
    - Tracks the net profit (money left over after paying all the bills) over the last 3-5 years
    - Depends on historical data available

## 3. Compliance Indicators
- **High Priority**
- It’s about behavior and discipline
- Checks if the company is submitting the mandatory reports on time

## 4. Network Risk
- **High Priority**
- Checks the connections the company has
- Core idea, a company can look perfectly healthy, but if its network of partners companies is collapsing, it’s a high risk of being dragged down with them
