from fpdf import FPDF
from datetime import date
import os
from pathlib import Path
import tempfile

#defined the brand color, the logo
BRAND_COLOR = (106, 112, 215)

#logo path - check for PNG/JPG first, try to convert SVG if available
LOGO_PATH_PNG = Path(__file__).parent / 'logo.png'
LOGO_PATH_JPG = Path(__file__).parent / 'logo.jpg'
LOGO_PATH_SVG = Path(__file__).parent / 'logo.svg'

def get_logo_path():
    """Get a usable logo path, converting SVG to PNG if necessary"""
    # Check for PNG first
    if LOGO_PATH_PNG.exists():
        return str(LOGO_PATH_PNG)
    # Check for JPG
    if LOGO_PATH_JPG.exists():
        return str(LOGO_PATH_JPG)
    # Try to convert SVG to PNG if cairosvg is available
    if LOGO_PATH_SVG.exists():
        try:
            import cairosvg
            # Create a temporary PNG file
            temp_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            cairosvg.svg2png(url=str(LOGO_PATH_SVG), write_to=temp_png.name, output_width=200)
            return temp_png.name
        except ImportError:
            # cairosvg not available, will fall back to text
            pass
        except Exception:
            # Conversion failed, will fall back to text
            pass
    return None

LOGO_PATH = get_logo_path()

class BrandedPDF(FPDF):
    """
    Custom pdf class for the header and footer of the pdf
    """
    def header(self):
        # Only add logo if a valid image format is available
        if LOGO_PATH:
            try:
                self.image(LOGO_PATH, 10, 8, 33, link='https://bizray.bnbdevelopment.hu')
            except Exception:
                # If image loading fails, fall back to text
                self._add_text_logo()
        else:
            # Add text-based branding if no logo available
            self._add_text_logo()

        #font for the rest of the header
        self.set_font('Helvetica', 'B', 15)
        self.ln(20)

    def _add_text_logo(self):
        """Add text-based logo as fallback"""
        self.set_font('Helvetica', 'B', 18)
        self.set_text_color(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2])
        self.cell(50, 10, 'BizRay', ln=False, link='https://bizray.bnbdevelopment.hu')
        self.set_text_color(0, 0, 0)

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
    company_name = company_data.get('name') or 'N/A'
    pdf.cell(0, 10, str(company_name), ln=True)

    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    firmenbuchnummer = company_data.get('firmenbuchnummer') or 'N/A'
    pdf.cell(0, 8, f"Firmenbuchnummer: {str(firmenbuchnummer)}", ln=True)

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

    # Address handling with proper None checks
    address = company_data.get('address') or {}
    street = address.get('street') or ''
    house_number = address.get('house_number') or ''
    postal_code = address.get('postal_code') or ''
    city = address.get('city') or ''
    country = address.get('country') or ''

    street_line = f"{street} {house_number}".strip()
    city_line = f"{postal_code} {city}".strip()
    if country:
        city_line = f"{city_line}, {country}" if city_line else country

    full_address = f"{street_line}\n{city_line}".strip() or "N/A"

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(0, 7, "Address:", ln=True)
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.multi_cell(0, 7, full_address)
    pdf.ln(2)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Legal Form:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 7, str(company_data.get('legal_form') or 'N/A'), ln=True)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Seat:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 7, str(company_data.get('seat') or 'N/A'), ln=True)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(0, 7, "Business Purpose:", ln=True)
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    # Use multi_cell for the purpose as it can be long
    business_purpose = company_data.get('business_purpose')
    pdf.multi_cell(0, 7, str(business_purpose) if business_purpose else 'N/A')
    pdf.ln(2)

    pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
    pdf.cell(40, 7, "Reference Date:")
    pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
    pdf.cell(0, 7, str(company_data.get('reference_date') or 'N/A'), ln=True)

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
            reg_date = entry.get('registration_date')
            reg_date_str = str(reg_date) if reg_date else 'N/A'
            entry_type = entry.get('type')
            entry_type_str = str(entry_type) if entry_type else 'N/A'
            court = entry.get('court')
            court_str = str(court) if court else 'N/A'

            pdf.cell(40, 6, reg_date_str, border=1)
            pdf.cell(80, 6, entry_type_str, border=1)
            pdf.cell(0, 6, court_str, border=1, ln=1)
        if len(registry_entries) > 5:
            pdf.set_font(FONT_FAMILY, 'I', 8)
            pdf.cell(0, 6, f"...and {len(registry_entries) - 5} more entries.", ln=1)
    else:
        pdf.set_font(FONT_FAMILY, 'I', BODY_FONT_SIZE)
        pdf.cell(0, 7, "No registry filings found.", ln=True)

    pdf.ln(10)

    # Get the PDF output
    output = pdf.output()

    # Handle different return types from different fpdf2 versions
    if isinstance(output, bytes):
        return output
    elif isinstance(output, bytearray):
        return bytes(output)
    elif isinstance(output, str):
        # Older versions or certain configurations return string
        return output.encode('latin-1')
    else:
        # Fallback - try to convert to bytes
        return bytes(output)

