import pytest
from datetime import date
from src.indicators import (
    debt_to_equity_ratio,
    concentration_risk,
    balance_sheet_volatility,
    check_for_irregular_fiscal_year,
    deferred_income_reliance,
    check_compliance_status
)
from src.db import RegistryEntry


# Test for dept to equity
def test_dept_to_equity_happy_path():
    assert debt_to_equity_ratio(50_000_000.0, 100_000_000.0) == 0.5

def test_debt_to_equity_high_risk():
    assert debt_to_equity_ratio(200_000_000.0, 100_000_000.0) == 2.0

def test_debt_to_equity_edge_cases_insolvent():
    assert debt_to_equity_ratio(100_000_000.0, 0.0) is None
    assert debt_to_equity_ratio(100_000_000.0, -50_000_000.0) is None

# Test for concentration risk
def test_concentration_risk_happy_path():
    assert concentration_risk(10_000_000.0, 100_000_000.0) == 10.0

def test_concentration_risk_edge_case():
    assert concentration_risk(10_000_000.0, 0.0) is None

# test for balance sheet
def test_volatility_happy_path_growth():
    assert balance_sheet_volatility(120.0, 100.0) == 20.0

def test_volatility_happy_path_shrink():
    assert balance_sheet_volatility(80.0, 100.0) == -20.0

def test_volatility_edge_cases():
    assert balance_sheet_volatility(100.0, 0.0) is None
    assert balance_sheet_volatility(0.0, 0.0) == 0.0

# Test for irregular fiscal year
def test_irregular_year_happy_path_standard():
    start = date(2023, 1, 1)
    end = date(2023, 12, 31)
    assert check_for_irregular_fiscal_year(start, end) is False

def test_irregular_year_happy_path_short():
    start = date(2023, 1, 1)
    end = date(2023, 11, 30)
    assert check_for_irregular_fiscal_year(start, end) is True

def test_irregular_year_edge_cases():
    start = date(2023, 1, 1)
    end = date(2023, 1, 31)
    assert check_for_irregular_fiscal_year(start, end) is True

#Test for deferred income
def test_deferred_income_happy_path():
    assert deferred_income_reliance(5_000_000.0, 100_000_000.0) == 5.0

def test_deferred_income_edge_case():
    assert deferred_income_reliance(5_000_000.0, 0.0) is None


#Test for compliance indicators
def test_status_is_compliant():
    recent_filings = [
        RegistryEntry(registration_date=date(2022, 1, 10), type="Gründung"),
        RegistryEntry(registration_date=date(2023, 5, 15), type="Jahresabschluss 2022")
    ]
    assert check_compliance_status(recent_filings, check_date=date(2024, 1, 1)) is True

def test_status_not_compliant():
    old_filings = [
        RegistryEntry(registration_date=date(2020, 3, 3), type="Gründung"),
        RegistryEntry(registration_date=date(2021, 5, 20), type="Jahresabschluss 2020")
    ]
    assert check_compliance_status(old_filings, check_date=date(2024, 1, 1)) is False

def test_compliance_status_no_filings():
    assert check_compliance_status([], check_date=date(2024, 1, 1)) is False



def test_compliance_status_no_dates():
    filings_without_dates = [RegistryEntry(type="Angekündigt", registration_date=None)]
    assert check_compliance_status(filings_without_dates, check_date=date(2024, 1, 1)) is None













