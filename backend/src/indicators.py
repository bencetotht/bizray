from typing import Optional, List
from datetime import date, timedelta
from .db import RegistryEntry

def debt_to_equity_ratio(shareholders_equity: float, total_liabilities: float) -> Optional[float]:
    """
    Calculates the debt to equity ratio.
    high ratio: red flag for risk
    Parameters:
    - total_assets: float
    - total_liabilities: float
    Returns:
    - debt to equity ratio: float
    """
    if total_liabilities <= 0:
        return None

    ratio = shareholders_equity / total_liabilities

    return ratio


def concentration_risk(receivables_from_affiliates: float, total_assets: float) -> Optional[float]:
    """
    Calculates the concentration risk as the percentage of Total Assets (receivable from partner companies)
    returns percentage or none if data is missing
    !!! High percentage => Major risk flag
    receivables_from_affiliates - money the company is owed by its subsidiaries or parent companies
    """

    if total_assets <= 0:
        return None

    concentration_percentage = (receivables_from_affiliates / total_assets) * 100
    return concentration_percentage


def balance_sheet_volatility(current_value: float, previous_value: float) -> Optional[float]:
    """
    Calculates the percentage growth of a balance sheet item
    extreme growth can mean high risk activities
    """
    if previous_value == 0:
        if current_value == 0:
            return 0.0
        else:
            return None

    growth_percentage = ((current_value - previous_value) / previous_value) * 100
    return growth_percentage

def check_for_irregular_fiscal_year(start_date: date, end_date: date) -> bool:
    """
    checks if the fiscal year is a short year (less than 12 months)
    flag for instability or major corporate event
    return true if year is irregular and false if standard year
    """
    nr_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    #standard year can be 11 months + many days, up to 12.
    #checked if the month count is less than 11 to be safe.
    return nr_months < 11

def deferred_income_reliance(deferred_income: float, total_funding: float) -> Optional[float]:
    """
    calculates how much of a company's total funding comes from customers paying upfront
    high reliance can be risky
    """
    if total_funding <= 0:
        return None

    reliance_percentage = (deferred_income / total_funding) * 100
    return reliance_percentage

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







