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
        xml_content = content.decode('utf-8')
    else:
        xml_content = str(content)
    
    extracted_data = extract_bilanz_fields(xml_content)
    client.close()
    return extracted_data

def calculate_risk_indicators(extracted_data):
    """
    Calculate the risk indicators from the extracted data
    Args:
        extracted_data: the extracted data from the urkunde
    Returns:
        risk_indicators: the risk indicators from the extracted data
        risk_score: the risk score from the extracted data
    """
    if extracted_data is None:
        return None, None

    assets = extracted_data.get('assets', {})
    liabilities_equity = extracted_data.get('liabilities_equity', {})
    
    # Extract values with safe defaults
    equity = liabilities_equity.get('equity')
    total_liabilities = liabilities_equity.get('liabilities')
    total_assets = assets.get('total_assets')
    deferred_income = liabilities_equity.get('deferred_income')
    receivables_and_other_assets = assets.get('receivables_and_other_assets')
    
    total_funding = None
    if equity is not None and total_liabilities is not None:
        total_funding = equity + total_liabilities
    
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
        
        # Balance Sheet Volatility: Medium Priority
        'balance_sheet_volatility': None,
        
        # Irregular Fiscal Year
        'irregular_fiscal_year': check_for_irregular_fiscal_year(extracted_data.get('fiscal_year').get('start_date'), extracted_data.get('fiscal_year').get('end_date')),
        
        # Compliance Status
        'compliance_status': None,
    }
    
    risk_score = np.mean([risk_indicator for risk_indicator in risk_indicators.values() if risk_indicator is not None and risk_indicator is not False])
    return risk_indicators, risk_score