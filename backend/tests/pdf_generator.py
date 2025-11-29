import pytest
from src.pdf_generator import create_company_pdf, BrandedPDF

@pytest.fixture
def mock_pdf_header(mocker):
    """
    Mocks the BrandedPDF header to avoid dependency on the logo file for this unit test
    """
    mocker.patch.object(BrandedPDF, 'header', lambda self: None)


def test_create_company_pdf():
    fake_company_data = {
        "name": "Unit Test PDF Corp.",
        "firmenbuchnummer": "FN-UNIT-TEST",
        "legal_form": "AG",
        "seat": "Testburg",
        "business_purpose": "Generating excellent PDFs for testing purposes.",
        "reference_date": "2024-01-01",
        "address": {
            "street": "Test Lane",
            "house_number": "123",
            "postal_code": "9999",
            "city": "Testville",
            "country": "Testland"
        },
        "partners": [
            {"name": "Jane Doe", "role": "CEO"},
            {"name": "John Smith", "role": "CTO"}
        ],
        "registry_entries": [
            {
                "registration_date": "2022-05-10",
                "type": "Initial Registration",
                "court": "Test Court"
            }
        ]
    }

    fake_risk_analysis = {
        "indicators": {
            "debtToEquityScore": 0.25,
            "cashRatio": 2.5,
            "hasIrregularYear": True
        }
    }

    pdf_bytes = create_company_pdf(fake_company_data, fake_risk_analysis)
    #it shouldn't be empty
    assert len(pdf_bytes) > 100

    #it should be type 'bytes'
    assert isinstance(pdf_bytes, bytes)

    #all valid pdf files start with "%PDF-"
    #the b before the string means bytes
    assert pdf_bytes.startswith(b"%PDF-")



