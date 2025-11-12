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


# Test for debt to equity
def test_dept_to_equity_happy_path():
    # equity=50M, liabilities=100M -> ratio=0.5 -> risk_score=1/(1+0.5)=0.666...
    result = debt_to_equity_ratio(50_000_000.0, 100_000_000.0)
    assert abs(result - 0.6666666666666666) < 0.0001

def test_debt_to_equity_high_risk():
    # equity=100M, liabilities=200M -> ratio=0.5 -> risk_score=1/(1+0.5)=0.666...
    # Note: higher liabilities relative to equity = higher risk
    result = debt_to_equity_ratio(100_000_000.0, 200_000_000.0)
    assert abs(result - 0.6666666666666666) < 0.0001

def test_debt_to_equity_very_high_risk():
    # equity=50M, liabilities=200M -> ratio=0.25 -> risk_score=1/(1+0.25)=0.8
    result = debt_to_equity_ratio(50_000_000.0, 200_000_000.0)
    assert abs(result - 0.8) < 0.0001

def test_debt_to_equity_low_risk():
    # equity=200M, liabilities=50M -> ratio=4.0 -> risk_score=1/(1+4.0)=0.2
    result = debt_to_equity_ratio(200_000_000.0, 50_000_000.0)
    assert abs(result - 0.2) < 0.0001

def test_debt_to_equity_edge_cases_insolvent():
    assert debt_to_equity_ratio(100_000_000.0, 0.0) is None
    assert debt_to_equity_ratio(100_000_000.0, -50_000_000.0) is None

# Test for concentration risk
def test_concentration_risk_happy_path():
    # 10M receivables / 100M assets = 0.1 risk score
    assert concentration_risk(10_000_000.0, 100_000_000.0) == 0.1

def test_concentration_risk_high():
    # 50M receivables / 100M assets = 0.5 risk score
    assert concentration_risk(50_000_000.0, 100_000_000.0) == 0.5

def test_concentration_risk_edge_case():
    assert concentration_risk(10_000_000.0, 0.0) is None

# test for balance sheet
def test_volatility_happy_path_growth():
    # 20% growth -> risk_score = min(1.0, 20/50) = 0.4
    assert balance_sheet_volatility(120.0, 100.0) == 0.4

def test_volatility_happy_path_shrink():
    # -20% change -> risk_score = min(1.0, 20/50) = 0.4 (absolute value)
    assert balance_sheet_volatility(80.0, 100.0) == 0.4

def test_volatility_high_risk():
    # 50% growth -> risk_score = min(1.0, 50/50) = 1.0
    assert balance_sheet_volatility(150.0, 100.0) == 1.0

def test_volatility_no_change():
    # 0% change -> risk_score = min(1.0, 0/50) = 0.0
    assert balance_sheet_volatility(100.0, 100.0) == 0.0

def test_volatility_edge_cases():
    assert balance_sheet_volatility(100.0, 0.0) is None
    assert balance_sheet_volatility(0.0, 0.0) == 0.0

# Test for irregular fiscal year
def test_irregular_year_happy_path_standard():
    start = "2023-01-01"
    end = "2023-12-31"
    assert check_for_irregular_fiscal_year(start, end) is False

def test_irregular_year_happy_path_short():
    start = "2023-01-01"
    end = "2023-11-30"
    assert check_for_irregular_fiscal_year(start, end) is True

def test_irregular_year_edge_cases():
    start = "2023-01-01"
    end = "2023-01-31"
    assert check_for_irregular_fiscal_year(start, end) is True

#Test for deferred income
def test_deferred_income_happy_path_low_reliance():
    # 5M / 100M = 0.05 (< 0.5 threshold) -> False
    assert deferred_income_reliance(5_000_000.0, 100_000_000.0) is False

def test_deferred_income_high_reliance():
    # 60M / 100M = 0.6 (>= 0.5 threshold) -> True
    assert deferred_income_reliance(60_000_000.0, 100_000_000.0) is True

def test_deferred_income_exact_threshold():
    # 50M / 100M = 0.5 (>= 0.5 threshold) -> True
    assert deferred_income_reliance(50_000_000.0, 100_000_000.0) is True

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













