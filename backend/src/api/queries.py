from .client import ZeepClient
from .xml_parse import extract_bilanz_fields
import numpy as np
import os
from ..indicators import *

def get_company_urkunde(fnr):
    """
    Search for the latest urkunde by fnr and return the response
    Args:
        fnr: the fnr of the company
    Returns:
        urkunde_response: the response from the search_urkunde_by_fnr function
    """
    client = ZeepClient(os.getenv("API_KEY"), os.getenv("WSDL_URL"))
    urkunde_response = client.search_urkunde_by_fnr(fnr)
    if urkunde_response is None or len(urkunde_response) == 0:
        print(f"No urkunde found for FNR: {fnr}")
        return None
    urkunde_response_xmls = [urkunde for urkunde in urkunde_response if urkunde.KEY.endswith('XML')]
    if len(urkunde_response_xmls) == 0:
        print(f"No XML urkunde found for FNR: {fnr}")
        return None
    client.close()
    return urkunde_response_xmls

def get_urkunde_content(key):
    """
    Get the content of the urkunde and return the extracted data
    Args:
        key: the key of the urkunde
    Returns:
        extracted_data: the extracted data from the urkunde
    """
    client = ZeepClient(os.getenv("API_KEY"), os.getenv("WSDL_URL"))
    urkunde_content = client.get_urkunde(key)
    if urkunde_content is None:
        client.close()
        return None
    
    # Extract XML content from the response object
    content = urkunde_content.DOKUMENT.CONTENT
    if isinstance(content, bytes):
        xml_content = content.decode('utf-8', errors='replace')
    else:
        xml_content = str(content)
    
    extracted_data = extract_bilanz_fields(xml_content)
    client.close()
    return extracted_data

def get_all_urkunde_contents(urkunde_list):
    """
    Get the content of all urkunde entries and return a list of extracted data
    Args:
        urkunde_list: list of urkunde objects with KEY attribute
    Returns:
        list of extracted_data: list of extracted data from all urkunde entries
    """
    if urkunde_list is None or len(urkunde_list) == 0:
        return []
    
    all_extracted_data = []
    client = ZeepClient(os.getenv("API_KEY"), os.getenv("WSDL_URL"))
    
    try:
        for urkunde in urkunde_list:
            key = urkunde.KEY
            urkunde_content = client.get_urkunde(key)
            if urkunde_content is None:
                continue
            
            content = urkunde_content.DOKUMENT.CONTENT
            if isinstance(content, bytes):
                xml_content = content.decode('utf-8', errors='replace')
            else:
                xml_content = str(content)
            
            extracted_data = extract_bilanz_fields(xml_content)
            if extracted_data is not None:
                all_extracted_data.append(extracted_data)
    finally:
        client.close()
    
    return all_extracted_data

def calculate_risk_indicators(extracted_data, historical_data=None, registry_entries=None):
    """
    Calculate the risk indicators from the extracted data
    Args:
        extracted_data: the extracted data from the latest urkunde (used for most indicators)
        historical_data: optional list of historical extracted data (for future use with indicators that need historical context)
        registry_entries: optional list of RegistryEntry objects from the database (for compliance status)
    Returns:
        risk_indicators: the risk indicators from the extracted data
        risk_score: the risk score from the extracted data
    """
    if extracted_data is None:
        return None, None

    assets = extracted_data.get('assets', {})
    liabilities_equity = extracted_data.get('liabilities_equity', {})
    income_statement = extracted_data.get('income_statement', {})

    # Extract values with safe defaults
    equity = liabilities_equity.get('equity')
    total_liabilities = liabilities_equity.get('liabilities')
    total_assets = assets.get('total_assets')
    deferred_income = liabilities_equity.get('deferred_income')
    receivables_and_other_assets = assets.get('receivables_and_other_assets')
    cash_and_equivalents = assets.get('cash_and_cash_equivalents')

    # Extract income statement values
    current_revenue = income_statement.get('revenue')
    current_profit = income_statement.get('net_income')

    total_funding = None
    if equity is not None and total_liabilities is not None:
        total_funding = equity + total_liabilities

    # Extract historical data if available
    previous_revenue = None
    previous_profit = None
    previous_total_assets = None
    if historical_data and len(historical_data) > 0:
        historical_income = historical_data[0].get('income_statement', {})
        previous_revenue = historical_income.get('revenue')
        previous_profit = historical_income.get('net_income')
        historical_assets = historical_data[0].get('assets', {})
        previous_total_assets = historical_assets.get('total_assets')
    
    risk_indicators = {
        # Debt to Equity Ratio
        # Measures how much of the company is funded by borrowed money vs. owners' money
        'debt_to_equity_ratio': debt_to_equity_ratio(
            equity,  # shareholders_equity
            total_liabilities  # total_liabilities
        ) if equity is not None and total_liabilities is not None else None,
        
        # Concentration Risk
        # Percentage of Total Assets that are receivables from partner companies
        'concentration_risk': concentration_risk(
            receivables_and_other_assets or 0.0,
            total_assets
        ) if total_assets is not None and receivables_and_other_assets is not None else None,
        
        # Deferred Income Reliance
        # Calculates how much of a company's total funding comes from customers paying upfront
        'deferred_income_reliance': deferred_income_reliance(
            deferred_income or 0.0,
            total_funding
        ) if deferred_income is not None and total_funding is not None and total_funding > 0 else None,
        
        # Balance Sheet Volatility
        # Measures extreme changes in balance sheet values
        'balance_sheet_volatility': balance_sheet_volatility(
            total_assets,
            previous_total_assets
        ) if total_assets is not None and previous_total_assets is not None else None,

        # Irregular Fiscal Year
        'irregular_fiscal_year': check_for_irregular_fiscal_year(extracted_data.get('fiscal_year').get('start_date'), extracted_data.get('fiscal_year').get('end_date')),

        # Compliance Status
        'compliance_status': check_compliance_status(registry_entries or []),

        # Cash Ratio
        # Liquidity metric showing ability to cover short-term debts with cash
        'cash_ratio': cash_ratio(
            cash_and_equivalents or 0.0,
            total_liabilities
        ) if cash_and_equivalents is not None and total_liabilities is not None else None,

        # Debt to Assets Ratio
        # Shows what percentage of assets are financed by debt
        'debt_to_assets_ratio': debt_to_assets_ratio(
            total_liabilities,
            total_assets
        ) if total_liabilities is not None and total_assets is not None else None,

        # Equity Ratio
        # Shows what percentage of assets are funded by owners' capital
        'equity_ratio': equity_ratio(
            equity,
            total_assets
        ) if equity is not None and total_assets is not None else None,

        # Growth Revenue
        # Year-over-year revenue growth percentage
        'growth_revenue': growth_revenue(
            current_revenue,
            previous_revenue
        ) if current_revenue is not None and previous_revenue is not None else None,

        # Operational Result Profit
        # Year-over-year profit growth rate
        'operational_result_profit': operational_result_profit(
            current_profit,
            previous_profit
        ) if current_profit is not None and previous_profit is not None else None,
    }
    
    risk_score = np.mean([risk_indicator for risk_indicator in risk_indicators.values() if risk_indicator is not None and risk_indicator is not False])
    return risk_indicators, risk_score