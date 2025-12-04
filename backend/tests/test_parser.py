import pytest
import xml.etree.ElementTree as ET
from datetime import date

from parser import (
    parse_date,
    parse_entry,
    parse_partners,
    parse_registry_entries,
    parse_file,
    load_into_db,
)
from src.db import Company, Partner, Address


SAMPLE_XML = """
<ns1:Auszug FNR="12345 a" STICHTAG="20241108" ABFRAGEZEITPUNKT="20241108120000" xmlns:ns1="ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse">
    <ns1:FI>
        <ns1:FI_DKZ02>
            <ns1:BEZEICHNUNG>Testfirma GmbH</ns1:BEZEICHNUNG>
        </ns1:FI_DKZ02>
        <ns1:FI_DKZ03>
            <ns1:STRASSE>Teststraße</ns1:STRASSE>
            <ns1:HAUSNUMMER>123</ns1:HAUSNUMMER>
            <ns1:PLZ>1010</ns1:PLZ>
            <ns1:ORT>Wien</ns1:ORT>
            <ns1:STAAT>Österreich</ns1:STAAT>
        </ns1:FI_DKZ03>
        <ns1:FI_DKZ05>
            <ns1:TEXT>Handel mit Waren aller Art</ns1:TEXT>
        </ns1:FI_DKZ05>
        <ns1:FI_DKZ06>
            <ns1:SITZ>Wien</ns1:SITZ>
        </ns1:FI_DKZ06>
        <ns1:FI_DKZ07>
            <ns1:RECHTSFORM>
                <ns1:TEXT>Gesellschaft mit beschränkter Haftung</ns1:TEXT>
            </ns1:RECHTSFORM>
        </ns1:FI_DKZ07>
    </ns1:FI>
    <ns1:PER PNR="P1">
        <ns1:PE_DKZ02>
            <ns1:NAME_FORMATIERT>Dr. Maria Mustermann</ns1:NAME_FORMATIERT>
            <ns1:VORNAME>Maria</ns1:VORNAME>
            <ns1:NACHNAME>Mustermann</ns1:NACHNAME>
            <ns1:GEBURTSDATUM>19800510</ns1:GEBURTSDATUM>
        </ns1:PE_DKZ02>
    </ns1:PER>
    <ns1:FUN PNR="P1" FKENTEXT="Geschäftsführer(in)">
        <ns1:FU_DKZ10>
            <ns1:VART>
                <ns1:TEXT>selbständig vertretungsbefugt</ns1:TEXT>
            </ns1:VART>
        </ns1:FU_DKZ10>
    </ns1:FUN>
    <ns1:VOLLZ>
        <ns1:HG>
            <ns1:TEXT>Handelsgericht Wien</ns1:TEXT>
        </ns1:HG>
        <ns1:AZ>FN 12345a</ns1:AZ>
        <ns1:EINGELANGTAM>20230115</ns1:EINGELANGTAM>
        <ns1:VOLLZUGSDATUM>20230120</ns1:VOLLZUGSDATUM>
        <ns1:ANTRAGSTEXT>Neueintragung</ns1:ANTRAGSTEXT>
    </ns1:VOLLZ>
</ns1:Auszug>
"""

@pytest.fixture
def sample_xml_file(tmp_path):
    file_path = tmp_path / "sample.xml"
    file_path.write_text(SAMPLE_XML, encoding="utf-8")
    return str(file_path)


def test_parse_date():
    assert parse_date("20241108") == date(2024, 11, 8)
    assert parse_date("2024-11-08") == date(2024, 11, 8)
    assert parse_date(None) is None
    with pytest.raises(ValueError):
        parse_date("2024/11/08")

def test_parse_partners():
    root = ET.fromstring(SAMPLE_XML)
    partners = parse_partners(root)
    assert len(partners) == 1
    assert partners[0]["name"] == "Dr. Maria Mustermann"
    assert partners[0]["birth_date"] == "1980-05-10"

def test_parse_registry_entries():
    root = ET.fromstring(SAMPLE_XML)
    entries = parse_registry_entries(root)
    assert len(entries) == 1
    assert entries[0]["court"] == "Handelsgericht Wien"
    assert entries[0]["type"] == "Neueintragung"
    assert entries[0]["registration_date"] == "20230120"

def test_parse_file(sample_xml_file):
    data = parse_file(sample_xml_file)
    assert data is not None
    assert data["name"] == "Testfirma GmbH"
    assert len(data["partners"]) == 1
    assert len(data["registry_entries"]) == 1
    assert data["partners"][0]["name"] == "Dr. Maria Mustermann"


