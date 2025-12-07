from fpdf import FPDF
from datetime import date
import os
from pathlib import Path
import tempfile

# Brand colors
BRAND_COLOR = (106, 112, 215)

# Risk level colors
RISK_LOW = (76, 175, 80)      # Green
RISK_MEDIUM = (255, 152, 0)   # Orange
RISK_HIGH = (244, 67, 54)     # Red
RISK_NEUTRAL = (158, 158, 158) # Gray

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
    Raises:
        - Exception: If PDF generation fails due to formatting or content issues
    """
    try:
        pdf = BrandedPDF('P', 'mm', 'A4')
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
    except Exception as e:
        raise Exception(f"Failed to initialize PDF: {str(e)}")

    # Defining fonts and helpers
    TITLE_FONT_SIZE = 20
    HEADER_FONT_SIZE = 14
    BODY_FONT_SIZE = 10
    FONT_FAMILY = 'Helvetica'

    def safe_text(text, max_length=None):
        """Safely convert text to string and optionally truncate"""
        text_str = str(text) if text is not None else 'N/A'
        if max_length and len(text_str) > max_length:
            return text_str[:max_length-3] + "..."
        return text_str

    def add_section_header(title):
        pdf.set_font(FONT_FAMILY, 'B', HEADER_FONT_SIZE)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 8, safe_text(title))
        pdf.set_text_color(0, 0, 0)
        pdf.ln(3)

    def get_risk_color(value):
        """Determine color based on risk value (0-1 scale, higher is riskier)"""
        if value is None:
            return RISK_NEUTRAL
        if value < 0.33:
            return RISK_LOW
        elif value < 0.66:
            return RISK_MEDIUM
        else:
            return RISK_HIGH

    def draw_progress_bar(x, y, width, height, value, max_value=1.0):
        """Draw a simple colored progress bar"""
        if value is None:
            pdf.set_fill_color(230, 230, 230)
            pdf.rect(x, y, width, height, 'F')
            return

        # Background
        pdf.set_fill_color(245, 245, 245)
        pdf.rect(x, y, width, height, 'F')

        # Calculate fill percentage
        fill_width = (value / max_value) * width if max_value > 0 else 0
        fill_width = min(fill_width, width)

        # Get color based on risk level
        color = get_risk_color(value)
        pdf.set_fill_color(color[0], color[1], color[2])

        # Draw filled portion
        if fill_width > 0:
            pdf.rect(x, y, fill_width, height, 'F')


    try:
        # COMPANY HEADER - Simple and clean
        pdf.set_font(FONT_FAMILY, 'B', TITLE_FONT_SIZE)
        company_name = safe_text(company_data.get('name'), max_length=100)
        # Use multi_cell for company name to handle long names
        pdf.multi_cell(0, 10, company_name)

        pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
        pdf.set_text_color(100, 100, 100)
        firmenbuchnummer = safe_text(company_data.get('firmenbuchnummer'))
        pdf.multi_cell(0, 5, f"Firmenbuchnummer: {firmenbuchnummer}")
        pdf.multi_cell(0, 5, f"Report generated: {date.today().isoformat()}")
        pdf.set_text_color(0, 0, 0)

        pdf.ln(8)
    except Exception as e:
        raise Exception(f"Failed to render company header: {str(e)}")


    try:
        # RISK ANALYSIS - Clean list with bars
        add_section_header("Risk Indicators")

        indicators = risk_analysis.get('indicators', {})

        # All indicators in a simple list
        all_indicators = {
            'debt_to_equity_ratio': 'Debt to Equity Ratio',
            'debt_to_assets_ratio': 'Debt to Assets Ratio',
            'equity_ratio': 'Equity Ratio',
            'cash_ratio': 'Cash Ratio',
            'concentration_risk': 'Concentration Risk',
            'balance_sheet_volatility': 'Balance Sheet Volatility',
            'growth_revenue': 'Revenue Growth',
            'operational_result_profit': 'Profit Growth',
        }

        bar_width = 70
        bar_height = 4

        pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)

        for key, label in all_indicators.items():
            if key in indicators:
                value = indicators[key]

                # Truncate label if too long to prevent overflow
                display_label = safe_text(label, max_length=35)

                # Label
                pdf.cell(80, 7, display_label)

                # Draw progress bar
                current_y = pdf.get_y()
                draw_progress_bar(95, current_y + 2, bar_width, bar_height, value)

                # Value
                display_value = f"{value:.0%}" if value is not None else "N/A"
                if value is not None:
                    color = get_risk_color(value)
                    pdf.set_text_color(color[0], color[1], color[2])

                pdf.cell(bar_width + 5, 7, '')
                pdf.cell(0, 7, display_value, ln=1)
                pdf.set_text_color(0, 0, 0)

        pdf.ln(3)

        # Boolean/compliance indicators - simple text list
        boolean_indicators = {
            'irregular_fiscal_year': 'Irregular Fiscal Year',
            'compliance_status': 'Compliance Issues',
            'deferred_income_reliance': 'Deferred Income Reliance'
        }

        for key, label in boolean_indicators.items():
            if key in indicators:
                value = indicators[key]

                # Truncate label if too long
                display_label = safe_text(label, max_length=35)

                if value is None:
                    status = "Unknown"
                    color = RISK_NEUTRAL
                elif isinstance(value, bool):
                    status = "Yes" if value else "No"
                    color = RISK_HIGH if value else RISK_LOW
                else:
                    status = f"{value:.0%}" if isinstance(value, float) else str(value)
                    color = get_risk_color(value) if isinstance(value, (int, float)) else RISK_NEUTRAL

                pdf.cell(80, 7, display_label)
                pdf.set_text_color(color[0], color[1], color[2])
                pdf.cell(0, 7, status, ln=1)
                pdf.set_text_color(0, 0, 0)

        pdf.ln(8)
    except Exception as e:
        raise Exception(f"Failed to render risk indicators: {str(e)}")


    try:
        # COMPANY INFORMATION - Simple two-column layout
        add_section_header("Company Information")

        pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)

        # Address handling
        address = company_data.get('address') or {}
        street = safe_text(address.get('street'))
        house_number = safe_text(address.get('house_number'))
        postal_code = safe_text(address.get('postal_code'))
        city = safe_text(address.get('city'))
        country = safe_text(address.get('country'))

        # Remove 'N/A' from intermediate parts, only use for final result
        street_line = f"{street} {house_number}".strip() if street != 'N/A' or house_number != 'N/A' else ''
        city_line = f"{postal_code} {city}".strip() if postal_code != 'N/A' or city != 'N/A' else ''
        if country != 'N/A':
            city_line = f"{city_line}, {country}" if city_line else country

        full_address = safe_text(f"{street_line}, {city_line}".strip(), max_length=150)
        if not full_address or full_address == ', ':
            full_address = 'N/A'

        # Simple field list
        info_fields = [
            ('Legal Form', safe_text(company_data.get('legal_form'), max_length=50)),
            ('Seat', safe_text(company_data.get('seat'), max_length=50)),
            ('Address', full_address),
            ('Reference Date', safe_text(company_data.get('reference_date'))),
        ]

        for field_label, field_value in info_fields:
            pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(40, 6, field_label + ':')
            pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(0, 6, field_value)

        pdf.ln(2)

        # Business Purpose
        pdf.set_font(FONT_FAMILY, 'B', BODY_FONT_SIZE)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 6, 'Business Purpose:', ln=True)
        pdf.set_font(FONT_FAMILY, '', BODY_FONT_SIZE)
        pdf.set_text_color(0, 0, 0)
        business_purpose = safe_text(company_data.get('business_purpose'), max_length=500)
        pdf.multi_cell(0, 5, business_purpose)

        pdf.ln(8)
    except Exception as e:
        raise Exception(f"Failed to render company information: {str(e)}")


    try:
        # REGISTRY ENTRIES - Simple table
        add_section_header("Registry Filings")

        registry_entries = company_data.get('registry_entries', [])
        if registry_entries:
            # Table header
            pdf.set_fill_color(240, 240, 240)
            pdf.set_font(FONT_FAMILY, 'B', 9)
            pdf.cell(35, 6, "Date", border=1, fill=True)
            pdf.cell(90, 6, "Type", border=1, fill=True)
            pdf.cell(0, 6, "Court", border=1, fill=True, ln=1)

            pdf.set_font(FONT_FAMILY, '', 9)

            # Table rows
            for entry in registry_entries[:10]:
                reg_date_str = safe_text(entry.get('registration_date'))
                entry_type_str = safe_text(entry.get('type'), max_length=40)
                court_str = safe_text(entry.get('court'), max_length=25)

                pdf.cell(35, 6, reg_date_str, border=1)
                pdf.cell(90, 6, entry_type_str, border=1)
                pdf.cell(0, 6, court_str, border=1, ln=1)

            if len(registry_entries) > 10:
                pdf.set_font(FONT_FAMILY, 'I', 8)
                pdf.set_text_color(120, 120, 120)
                pdf.cell(0, 5, f"...and {len(registry_entries) - 10} more entries", ln=1)
                pdf.set_text_color(0, 0, 0)
        else:
            pdf.set_font(FONT_FAMILY, 'I', BODY_FONT_SIZE)
            pdf.set_text_color(120, 120, 120)
            pdf.cell(0, 6, "No registry filings found", ln=True)
            pdf.set_text_color(0, 0, 0)
    except Exception as e:
        raise Exception(f"Failed to render registry entries: {str(e)}")

    try:
        # FOOTER - Document metadata
        pdf.ln(15)

        # Separator line
        pdf.set_draw_color(200, 200, 200)
        pdf.line(10, pdf.get_y(), pdf.w - 10, pdf.get_y())
        pdf.ln(5)

        pdf.set_font(FONT_FAMILY, '', 8)
        pdf.set_text_color(120, 120, 120)

        # Generated by line
        pdf.cell(0, 4, "Generated by BizRay (bizray.bnbdevelopment.hu)", ln=True, align='C')

        # Date and company number
        footer_text = f"Date: {date.today().isoformat()} | Company: {safe_text(company_data.get('firmenbuchnummer'), max_length=30)}"
        pdf.cell(0, 4, footer_text, ln=True, align='C')

        pdf.set_text_color(0, 0, 0)
    except Exception as e:
        raise Exception(f"Failed to render footer: {str(e)}")

    # Get the PDF output
    try:
        output = pdf.output(dest='S')

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
    except Exception as e:
        raise Exception(f"Failed to generate PDF output: {str(e)}")
