from typing import Optional, List
from datetime import date, timedelta, datetime
from .db import RegistryEntry

def debt_to_equity_ratio(shareholders_equity: float, total_liabilities: float) -> Optional[float]:
    """
    Calculates the debt-to-equity risk score as a decimal (0.0-1.0).
    Lower equity relative to liabilities = higher risk score.
    Formula: risk_score = 1 / (1 + equity_to_liabilities_ratio)
    - 0.0 risk: Very high equity ratio (low debt, high equity)
    - 0.5 risk: Equal equity and liabilities (ratio = 1)
    - 1.0 risk: No equity, all debt (ratio = 0)
    Parameters:
    - shareholders_equity: float
    - total_liabilities: float
    Returns:
    - risk score (0.0-1.0): float, or None if data is invalid
    """
    if total_liabilities <= 0:
        return None

    ratio = shareholders_equity / total_liabilities
    # Convert ratio to risk score: lower ratio = higher risk
    # Using inverse relationship: risk = 1 / (1 + ratio)
    risk_score = 1 / (1 + ratio)

    return min(1.0, max(0.0, risk_score))


def concentration_risk(receivables_from_affiliates: float, total_assets: float) -> Optional[float]:
    """
    Calculates the concentration risk as a decimal (0.0-1.0).
    Higher proportion of assets tied to affiliate receivables = higher risk.
    Formula: risk_score = receivables_from_affiliates / total_assets
    - 0.0 risk: No receivables from affiliates
    - 1.0 risk: All assets are receivables from affiliates
    Parameters:
    - receivables_from_affiliates: float (money owed by subsidiaries/parent companies)
    - total_assets: float
    Returns:
    - risk score (0.0-1.0): float, or None if data is invalid
    """
    if total_assets <= 0:
        return None

    risk_score = receivables_from_affiliates / total_assets
    return min(1.0, max(0.0, risk_score))


def balance_sheet_volatility(current_value: float, previous_value: float) -> Optional[float]:
    """
    Calculates balance sheet volatility risk as a decimal (0.0-1.0).
    Extreme changes (both positive and negative) indicate higher risk.
    Formula: risk_score = min(1.0, abs(growth_percentage) / volatility_threshold)
    Uses 50% change as threshold for maximum risk (1.0).
    - 0.0 risk: No change (0% growth)
    - 0.5 risk: 25% change in either direction
    - 1.0 risk: 50%+ change in either direction
    Parameters:
    - current_value: float
    - previous_value: float
    Returns:
    - risk score (0.0-1.0): float, or None if data is invalid
    """
    if previous_value == 0:
        if current_value == 0:
            return 0.0
        else:
            return None

    growth_percentage = ((current_value - previous_value) / previous_value) * 100
    # Convert absolute growth percentage to risk: extreme changes = higher risk
    # Using 50% change as the threshold for maximum risk
    volatility_threshold = 50.0
    risk_score = min(1.0, abs(growth_percentage) / volatility_threshold)

    return risk_score

def check_for_irregular_fiscal_year(start_date: str, end_date: str) -> bool:
    """
    checks if the fiscal year is a short year (less than 12 months)
    flag for instability or major corporate event
    return true if year is irregular and false if standard year
    """
    start_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")
    nr_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    #standard year can be 11 months + many days, up to 12.
    #checked if the month count is less than 11 to be safe.
    return nr_months < 11

def deferred_income_reliance(deferred_income: float, total_funding: float) -> Optional[bool]:
    """
    Checks if a company has high reliance on deferred income (customer prepayments).
    High reliance indicates risk as it suggests dependency on upfront customer payments.
    Formula: Returns True if deferred_income / total_funding > 0.5 (50% threshold)
    - False: Low reliance on deferred income (< 50% of total funding)
    - True: High reliance on deferred income (>= 50% of total funding)
    Parameters:
    - deferred_income: float (customer prepayments)
    - total_funding: float
    Returns:
    - bool: True if high reliance, False if low reliance, or None if data is invalid
    """
    if total_funding <= 0:
        return None

    reliance_ratio = deferred_income / total_funding
    # Consider high risk if more than 50% of funding comes from deferred income
    return reliance_ratio >= 0.5

def check_compliance_status(registry_entries: List[RegistryEntry], check_date: date = date.today()) -> Optional[bool]:
    """
    checks if a company appears to be compliant with recent fillings
    returns: true if compliant (recent filling exists) and false if it can't be determined
    """
    if not registry_entries:
        return False

    valid_entries = [entry for entry in registry_entries if entry.registration_date is not None]

    if not valid_entries:
        return None

    eighteen_months_ago = check_date - timedelta(days=548)
    most_recent_filling_date = max(entry.registration_date for entry in valid_entries)

    if most_recent_filling_date < eighteen_months_ago:
        return False
    else:
        return True


def cash_ratio(cash_and_equivalents: float, total_liabilities: float) -> Optional[float]:
    """
    =  a liquidity metric showing a company's ability to cover its short-term debts (current liabilities)
    using only its most liquid assets: cash and cash equivalents, without selling inventory or collecting accounts receivable
    cash_and_equivalents = cash & assets that can immediately be converted to cash
    total_liabilities = all the money a company owns (long-term and short-term)
    """

    if total_liabilities == 0:
        return None

    ratio = cash_and_equivalents / total_liabilities

    return ratio


def debt_to_assets_ratio(total_liabilities: float, total_assets: float) -> Optional[float]:
    """
    =  shows what percentage of a company's assets are financed by debt, indicating its financial leverage and stability
    by dividing Total Liabilities by Total Assets
    """

    if total_assets <= 0:
        return None

    ratio = total_liabilities / total_assets

    return ratio

def equity_ratio(shareholders_equity: float, total_assets: float) -> Optional[float]:
    """
    = shows what percentage of a company's assets are funded by the owners' own capital.
    higher ratio (over 50%) = greater financial stability, less reliance on debt
    """
    if total_assets <= 0:
        return None

    ratio = shareholders_equity / total_assets
    return ratio


def growth_revenue(current_revenue: float, previous_revenue: float) -> Optional[float]:
    """
    Calculates the year over year revenue growth percentage (measures how much the company's revenue increased/decreased
    compared to the previous period
    Parameters:
    - current_revenue: float (The revenue for the latest period)
    - previous_revenue: float (The revenue for the previous period)
    Returns:
    - growth_percentage: float (e.g., 15.5 for 15.5% growth), or None if data is invalid
    """
    if previous_revenue == 0:
        if current_revenue == 0:
            return 0.0
        return None
    #can't calculate percentage change if the previous value was 0, unless the current value is also 0

    growth_percentage = ((current_revenue - previous_revenue) / previous_revenue)
    return growth_percentage

def operational_result_profit(current_profit: float, previous_profit:float) -> Optional[float]:
    """
    Calculates the year over year profit growth rate as a decimal.
    measures the change in a company's net income or operational profit from one period to the next , indicating efficiency and market success
    """
    if previous_profit == 0:
        if current_profit == 0:
            return 0.0
        return None
    profit_growth = ((current_profit - previous_profit) / previous_profit)
    return profit_growth



