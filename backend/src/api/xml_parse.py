import xml.etree.ElementTree as ET
import json
import os
from typing import Dict, Optional


def extract_betrag(element: ET.Element, ns: Dict[str, str]) -> Optional[float]:
    """Extract BETRAG value from a POSTENZEILE element."""
    postenzeile = element.find('.//ns:POSTENZEILE', ns)
    if postenzeile is not None:
        betrag_elem = postenzeile.find('ns:BETRAG', ns)
        if betrag_elem is not None and betrag_elem.text:
            try:
                return float(betrag_elem.text)
            except ValueError:
                return None
    return None


def extract_bilanz_fields(xml_input: str) -> Dict:
    """
    Extract balance sheet fields from XML file or raw XML string into a JSON object.
    
    Args:
        xml_input: Either a path to an XML file or raw XML string content
        
    Returns:
        Dictionary containing extracted balance sheet fields
    """
    # Check if it's a file path or raw XML string
    if os.path.isfile(xml_input):
        tree = ET.parse(xml_input)
        root = tree.getroot()
    else:
        root = ET.fromstring(xml_input)
    
    ns = {'ns': 'https://finanzonline.bmf.gv.at/bilanz'}
    
    # Find BILANZ or HGB_Form_2 element (different XML formats use different parent names)
    bilanzen = root.find('.//ns:BILANZ', ns)
    if bilanzen is None:
        bilanzen = root.find('.//ns:HGB_Form_2', ns)
    if bilanzen is None:
        raise ValueError("BILANZ or HGB_Form_2 element not found in XML")
    
    # Find ALLG_JUSTIZ for currency and fiscal year
    allg_justiz = root.find('.//ns:ALLG_JUSTIZ', ns)
    currency = None
    fiscal_year = {
        "start_date": None,
        "end_date": None
    }
    
    if allg_justiz is not None:
        waehrung_elem = allg_justiz.find('ns:WAEHRUNG', ns)
        if waehrung_elem is not None:
            currency = waehrung_elem.text
        
        # Extract fiscal year information (GJ - Geschäftsjahr)
        gj_elem = allg_justiz.find('ns:GJ', ns)
        if gj_elem is not None:
            beginn_elem = gj_elem.find('ns:BEGINN', ns)
            if beginn_elem is not None and beginn_elem.text:
                fiscal_year["start_date"] = beginn_elem.text
            
            ende_elem = gj_elem.find('ns:ENDE', ns)
            if ende_elem is not None and ende_elem.text:
                fiscal_year["end_date"] = ende_elem.text
    
    # Initialize result dictionary
    result = {
        "assets": {},
        "liabilities_equity": {},
        "currency": currency,
        "fiscal_year": fiscal_year,
        "notes": {}
    }
    
    # Extract Assets (Aktiva - § 224 Abs. 2)
    hgb_224_2 = bilanzen.find('ns:HGB_224_2', ns)
    if hgb_224_2 is not None:
        result["assets"]["total_assets"] = extract_betrag(hgb_224_2, ns)
        
        # A. Fixed Assets (Anlagevermögen)
        hgb_224_2_a = hgb_224_2.find('ns:HGB_224_2_A', ns)
        if hgb_224_2_a is not None:
            result["assets"]["fixed_assets"] = extract_betrag(hgb_224_2_a, ns)
            
            # I. Intangible Assets
            hgb_224_2_a_i = hgb_224_2_a.find('ns:HGB_224_2_A_I', ns)
            if hgb_224_2_a_i is not None:
                result["assets"]["intangible_assets"] = extract_betrag(hgb_224_2_a_i, ns)
            
            # II. Tangible Assets
            hgb_224_2_a_ii = hgb_224_2_a.find('ns:HGB_224_2_A_II', ns)
            if hgb_224_2_a_ii is not None:
                result["assets"]["tangible_assets"] = extract_betrag(hgb_224_2_a_ii, ns)
            
            # III. Financial Assets
            hgb_224_2_a_iii = hgb_224_2_a.find('ns:HGB_224_2_A_III', ns)
            if hgb_224_2_a_iii is not None:
                result["assets"]["financial_assets"] = extract_betrag(hgb_224_2_a_iii, ns)
        
        # B. Current Assets (Umlaufvermögen)
        hgb_224_2_b = hgb_224_2.find('ns:HGB_224_2_B', ns)
        if hgb_224_2_b is not None:
            result["assets"]["current_assets"] = extract_betrag(hgb_224_2_b, ns)
            
            # I. Inventories
            hgb_224_2_b_i = hgb_224_2_b.find('ns:HGB_224_2_B_I', ns)
            if hgb_224_2_b_i is not None:
                result["assets"]["inventories"] = extract_betrag(hgb_224_2_b_i, ns)
            
            # II. Receivables and Other Assets
            hgb_224_2_b_ii = hgb_224_2_b.find('ns:HGB_224_2_B_II', ns)
            if hgb_224_2_b_ii is not None:
                result["assets"]["receivables_and_other_assets"] = extract_betrag(hgb_224_2_b_ii, ns)
            
            # III. Securities
            hgb_224_2_b_iii = hgb_224_2_b.find('ns:HGB_224_2_B_III', ns)
            if hgb_224_2_b_iii is not None:
                result["assets"]["securities"] = extract_betrag(hgb_224_2_b_iii, ns)
            
            # IV. Cash and Cash Equivalents
            hgb_224_2_b_iv = hgb_224_2_b.find('ns:HGB_224_2_B_IV', ns)
            if hgb_224_2_b_iv is not None:
                result["assets"]["cash_and_cash_equivalents"] = extract_betrag(hgb_224_2_b_iv, ns)
        
        # C. Prepaid Expenses
        hgb_224_2_c = hgb_224_2.find('ns:HGB_224_2_C', ns)
        if hgb_224_2_c is not None:
            result["assets"]["prepaid_expenses"] = extract_betrag(hgb_224_2_c, ns)
        
        # D. Active Deferred Taxes
        hgb_224_2_d = hgb_224_2.find('ns:HGB_224_2_D', ns)
        if hgb_224_2_d is not None:
            result["assets"]["active_deferred_taxes"] = extract_betrag(hgb_224_2_d, ns)
    
    # Extract Liabilities & Equity (Passiva - § 224 Abs. 3)
    hgb_224_3 = bilanzen.find('ns:HGB_224_3', ns)
    if hgb_224_3 is not None:
        result["liabilities_equity"]["total_liabilities_and_equity"] = extract_betrag(hgb_224_3, ns)
        
        # A. Equity (Eigenkapital)
        hgb_224_3_a = hgb_224_3.find('ns:HGB_224_3_A', ns)
        if hgb_224_3_a is not None:
            result["liabilities_equity"]["equity"] = extract_betrag(hgb_224_3_a, ns)
            
            # I. Subscribed Capital (Nennkapital)
            hgb_229_1_a_i = hgb_224_3_a.find('ns:HGB_229_1_A_I', ns)
            if hgb_229_1_a_i is not None:
                result["liabilities_equity"]["subscribed_capital"] = extract_betrag(hgb_229_1_a_i, ns)
            
            # II. Capital Reserves
            hgb_224_3_a_ii = hgb_224_3_a.find('ns:HGB_224_3_A_II', ns)
            if hgb_224_3_a_ii is not None:
                result["liabilities_equity"]["capital_reserves"] = extract_betrag(hgb_224_3_a_ii, ns)
            
            # III. Revenue Reserves
            hgb_224_3_a_iii = hgb_224_3_a.find('ns:HGB_224_3_A_III', ns)
            if hgb_224_3_a_iii is not None:
                result["liabilities_equity"]["revenue_reserves"] = extract_betrag(hgb_224_3_a_iii, ns)
            
            # IV. Net Profit/Loss
            hgb_224_3_a_iv = hgb_224_3_a.find('ns:HGB_224_3_A_IV', ns)
            if hgb_224_3_a_iv is not None:
                result["liabilities_equity"]["net_profit_loss"] = extract_betrag(hgb_224_3_a_iv, ns)
        
        # C. Liabilities
        hgb_224_3_c = hgb_224_3.find('ns:HGB_224_3_C', ns)
        if hgb_224_3_c is not None:
            result["liabilities_equity"]["liabilities"] = extract_betrag(hgb_224_3_c, ns)
        
        # D. Deferred Income
        hgb_224_3_d = hgb_224_3.find('ns:HGB_224_3_D', ns)
        if hgb_224_3_d is not None:
            result["liabilities_equity"]["deferred_income"] = extract_betrag(hgb_224_3_d, ns)
        
        # E. Passive Deferred Taxes
        hgb_224_3_e = hgb_224_3.find('ns:HGB_224_3_E', ns)
        if hgb_224_3_e is not None:
            result["liabilities_equity"]["passive_deferred_taxes"] = extract_betrag(hgb_224_3_e, ns)
    
    # Extract Notes fields (these may not exist in all XML files)
    # Note: These fields are typically in a different section, checking if they exist
    # HGB_Form_3_* fields would typically be in ANHANG or NOTES section
    # For now, we'll set them to None if not found
    notes_fields = {
        "HGB_Form_3_6": "accounting_and_valuation_principles",
        "HGB_Form_3_10": "foreign_currency_translation",
        "HGB_Form_3_11": "contingent_liabilities_guarantees",
        "HGB_Form_3_16": "average_number_of_employees",
        "HGB_Form_3_26": "information_on_deferred_taxes"
    }
    
    for hgb_field, readable_name in notes_fields.items():
        note_elem = root.find(f'.//ns:{hgb_field}', ns)
        if note_elem is not None:
            result["notes"][readable_name] = note_elem.text if note_elem.text else None
        else:
            result["notes"][readable_name] = None
    
    return result


def extract_bilanz_fields_to_json(xml_input: str, output_file_path: Optional[str] = None) -> str:
    """
    Extract balance sheet fields from XML and return as JSON string.
    Optionally save to file.
    
    Args:
        xml_input: Either a path to an XML file or raw XML string content
        output_file_path: Optional path to save JSON output
        
    Returns:
        JSON string of extracted fields
    """
    result = extract_bilanz_fields(xml_input)
    json_str = json.dumps(result, indent=2, ensure_ascii=False)
    
    # if output_file_path:
    #     with open(output_file_path, 'w', encoding='utf-8') as f:
    #         f.write(json_str)
    
    return json_str


if __name__ == "__main__":
    import os
    xml_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "extracted_xml.xml")
    
    print("Testing with file path:")
    json_output = extract_bilanz_fields_to_json(xml_path)
    print(json_output[:500] + "...")  # Print first 500 chars
    
    print("\n\nTesting with raw XML string:")
    with open(xml_path, 'r', encoding='utf-8') as f:
        xml_content = f.read()
    json_output2 = extract_bilanz_fields_to_json(xml_content)
    print(json_output2[:500] + "...")  # Print first 500 chars

