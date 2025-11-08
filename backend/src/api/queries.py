from client import ZeepClient
from xml_parse import extract_bilanz_fields
import json
import os

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
    extracted_data = extract_bilanz_fields(urkunde_content)
    client.close()
    return extracted_data