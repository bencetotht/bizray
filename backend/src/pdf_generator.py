from fpdf import FPDF
from datetime import date
import os
from pathlib import Path

#defined the brand color, the logo
BRAND_COLOR = (106, 112, 215)

#logo path
LOGO_PATH = Path(__file__).parent / 'logo.svg'

class BrandedPDF(FPDF):
    """
    Custom pdf class for the header and footer of the pdf
    """
    def header(self):
        self.image(LOGO_PATH, 10, 8, 33, link='https://bizray.bnbdevelopment.hu')

        #font for the rest of the header
        self.set_font('Helvetica', 'B', 15)
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)

        #page nr
        self.cell(0, 10, f"Page {self.page_no()}", 0, 0, 'C')



def create_company_pdf(company_data: dict, risk_analysis: dict) -> bytes:
    """
    Generates a pdf summary of a company's data and risk analysis.
    The function acts as a 'PDF builder', it takes clean data, puts it in a structured format using the FPDF2 library and returns the raw pdf content.
    Parameters:
        - company_data (dict): dict containing the company's core details from the controller
        - risk_analysis (dict): dict containing the calculated risk indicators
    Returns:
        - bytes: the raw content of the generated pdf file
    """

    pdf = BrandedPDF('P', 'mm', 'A4')
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    #defining fonts and helpers => easy to change it later
    TITLE_FONT_SIZE = 22
    HEADER_FONT_SIZE = 16
    BODY_FONT_SIZE = 11
    FONT_FAMILY = 'Helvetica'

    def add_section_header(title):
        pdf.set_font(FONT_FAMILY, 'B', HEADER_FONT_SIZE)
        pdf.set_text_color(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2])
        pdf.cell(0, 10, title, ln=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(2)   #space after header


    pdf.set_font(FONT_FAMILY, 'B', TITLE_FONT_SIZE)
    pdf.cell(0, 10, company_data.get('name', 'N/A'), ln=True)

    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 8, f"Firmenbuchnummer: {company_data.get('firmenbuchnummer', 'N/A')}", ln=True)

    pdf.set_font(FONT_FAMILY, 'I', 8)
    pdf.cell(0, 8, f"Report generated on: {date.today().isoformat()}", ln=True)
    pdf.ln(10)


    # RISK ANALYSIS

    add_section_header("Risk Indicator Summary")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)

    #format it into a 2 column layout
    col_width = pdf.w / 2 - 15
    indicators = risk_analysis.get('indicators', {})

    for key, value in indicators.items():
        display_key = key.replace('_', ' ').title()

        if value is None:
            display_value = "N/A"
        elif isinstance(value, bool):
            display_value = "High Risk" if value else "Normal"
        elif isinstance(value, float):
            display_value = f"{value:.0%}" # e.g., 0.55 -> "55%"
        else:
            display_value = str(value)

        pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
        pdf.cell(col_width, 8, f"{display_key}:")
        pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
        pdf.cell(col_width, 8, display_value, ln=1)

    pdf.ln(10)


    # COMPANY DATA

    add_section_header("Company Details")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)

    address = company_data.get('address') or {}
    full_address = (
        f"{address.get('street', '')} {address.get('house_number', '')}\n"
        f"{address.get('postal_code', '')} {address.get('city', '')}, {address.get('country', '')}"
    )

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(30, 7, "Address:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.multi_cell(0, 7, full_address)
    pdf.ln(2)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Legal Form:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 7, company_data.get('legal_form', 'N/A'), ln=True)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Seat:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 7, company_data.get('seat', 'N/A'), ln=True)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Business Purpose:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    # Use multi_cell for the purpose as it can be long
    pdf.multi_cell(0, 7, company_data.get('business_purpose', 'N/A'))

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Reference Date:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 7, company_data.get('reference_date', 'N/A'), ln=True)

    pdf.ln(10)

    # REGISTRY ENTRIES

    add_section_header("Official Registry Filings")
    registry_entries = company_data.get('registry_entries', [])
    if registry_entries:
        # Set up a header for our little table
        pdf.set_font(FONT_FAMILY, 'B', 10)
        pdf.cell(40, 7, "Registration Date", border=1)
        pdf.cell(80, 7, "Filing Type", border=1)
        pdf.cell(0, 7, "Court", border=1, ln=1)

        pdf.set_font(FONT_FAMILY, '', 9)
        # Loop through the first 5 entries to avoid a huge table
        for entry in registry_entries[:5]:
            pdf.cell(40, 6, entry.get('registration_date', 'N/A'), border=1)
            pdf.cell(80, 6, entry.get('type', 'N/A'), border=1)
            pdf.cell(0, 6, entry.get('court', 'N/A'), border=1, ln=1)
        if len(registry_entries) > 5:
            pdf.set_font(FONT_FAMILY, 'I', 8)
            pdf.cell(0, 6, f"...and {len(registry_entries) - 5} more entries.", ln=1)
    else:
        pdf.set_font(FONT_FAMILY, 'I', BODY_FONT_SIZE)
        pdf.cell(0, 7, "No registry filings found.", ln=True)

    pdf.ln(10)

    return bytes(pdf.output())

