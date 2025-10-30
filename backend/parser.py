import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime
from tqdm import tqdm
from src.db import (
    get_session,
    Company,
    Address,
    Partner,
    RegistryEntry,
    init_db,
)

ns = {"ns1": "ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse"}

def get_text(element, path):
    node = element.find(path, ns)
    return node.text.strip() if node is not None and node.text else None

def parse_entry(root):
    data = {
        "firmenbuchnummer": root.attrib.get("{ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse}FNR", "").replace(" ", ""),
        "name": get_text(root, ".//ns1:FI_DKZ02/ns1:BEZEICHNUNG"),
        "legal_form": get_text(root, ".//ns1:FI_DKZ07/ns1:RECHTSFORM/ns1:TEXT"),
        "address": {
            "street": get_text(root, ".//ns1:FI_DKZ03/ns1:STRASSE"),
            "house_number": get_text(root, ".//ns1:FI_DKZ03/ns1:HAUSNUMMER"),
            "postal_code": get_text(root, ".//ns1:FI_DKZ03/ns1:PLZ"),
            "city": get_text(root, ".//ns1:FI_DKZ03/ns1:ORT"),
            "country": get_text(root, ".//ns1:FI_DKZ03/ns1:STAAT"),
        },
        "business_purpose": get_text(root, ".//ns1:FI_DKZ05/ns1:TEXT"),
        "seat": get_text(root, ".//ns1:FI_DKZ06/ns1:SITZ"),
        "partners": [],
        "registry_entries": [],
        "euid": get_text(root, ".//ns1:EUID/ns1:EUID"),
        "reference_date": root.attrib.get("{ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse}STICHTAG"),
        "query_timestamp": root.attrib.get("{ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse}ABFRAGEZEITPUNKT"),
    }
    return data

def parse_partners(root):
    partners = []
    for per in root.findall(".//ns1:PER", ns):
        pnr = per.attrib.get("{ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse}PNR", "").strip()
        first = get_text(per, ".//ns1:PE_DKZ02/ns1:VORNAME")
        last = get_text(per, ".//ns1:PE_DKZ02/ns1:NACHNAME")
        name = get_text(per, ".//ns1:PE_DKZ02/ns1:NAME_FORMATIERT")
        birth = get_text(per, ".//ns1:PE_DKZ02/ns1:GEBURTSDATUM")
        
        fun = root.find(f".//ns1:FUN[@ns1:PNR='{pnr}']", ns)
        role = fun.attrib.get("{ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse}FKENTEXT") if fun is not None else None
        representation = get_text(fun, ".//ns1:FU_DKZ10/ns1:VART/ns1:TEXT") if fun is not None else None

        partners.append({
            "name": name,
            "first_name": first,
            "last_name": last,
            "birth_date": f"{birth[:4]}-{birth[4:6]}-{birth[6:]}" if birth else None,
            "role": role,
            "representation": representation
        })
    return partners

def parse_registry_entries(root):
    registry_entries = []   
    for vollz in root.findall(".//ns1:VOLLZ", ns):
        entry = {
            "court": get_text(vollz, "ns1:HG/ns1:TEXT"),
            "file_number": get_text(vollz, "ns1:AZ"),
            "application_date": get_text(vollz, "ns1:EINGELANGTAM"),
            "registration_date": get_text(vollz, "ns1:VOLLZUGSDATUM"),
            "type": "Änderung" if "Änderung" in (get_text(vollz, "ns1:ANTRAGSTEXT") or "") else "Neueintragung"
        }
        registry_entries.append(entry)
    return registry_entries

def load_into_db(data):
    try:
        session = get_session()
        
        # Create company
        company = Company(
            firmenbuchnummer=data["firmenbuchnummer"],
            name=data["name"],
            legal_form=data["legal_form"],
            business_purpose=data["business_purpose"],
            seat=data["seat"],
            reference_date=datetime.strptime(data["reference_date"], "%Y%m%d").date() if data["reference_date"] else None
        )
        
        # Create address
        if any(data["address"].values()):
            address = Address(
                street=data["address"]["street"],
                house_number=data["address"]["house_number"],
                postal_code=data["address"]["postal_code"],
                city=data["address"]["city"],
                country=data["address"]["country"]
            )
            company.address = address

        # Create partners
        for partner_data in data["partners"]:
            partner = Partner(
                name=partner_data["name"],
                first_name=partner_data["first_name"],
                last_name=partner_data["last_name"],
                birth_date=datetime.strptime(partner_data["birth_date"], "%Y-%m-%d").date() if partner_data["birth_date"] else None,
                role=partner_data["role"],
                representation=partner_data["representation"]
            )
            company.partners.append(partner)

        # Create registry entries
        for entry_data in data["registry_entries"]:
            entry = RegistryEntry(
                type=entry_data["type"],
                court=entry_data["court"],
                file_number=entry_data["file_number"],
                application_date=datetime.strptime(entry_data["application_date"], "%Y%m%d").date() if entry_data["application_date"] else None,
                registration_date=datetime.strptime(entry_data["registration_date"], "%Y%m%d").date() if entry_data["registration_date"] else None
            )
            company.registry_entries.append(entry)

        # Add and commit
        session.add(company)
        session.commit()
        
    except Exception as e:
        session.rollback()
        print(f"Error loading data into database: {e}")
        raise
    finally:
        session.close()

def parse_file(file_path):
    try:
        with open(file_path) as f:
            xml_string = f.read()
            root = ET.fromstring(xml_string)
            data = parse_entry(root)
            data["partners"] = parse_partners(root)
            data["registry_entries"] = parse_registry_entries(root)
            return data
    except Exception as e:
        print(f"Error parsing file {file_path}: {e}")
        return None

if __name__ == "__main__":
    # Initialize the database
    init_db()
    
    directory = '/Users/bencetoth/Downloads/bizrayds/node0/data1/fbp/appl_java/gesamtstand/auszuegeKurz/'
    
    for index, file in tqdm(enumerate(os.listdir(directory)), total=len(os.listdir(directory))):
        try:
            if not file.endswith('.xml'):
                continue
            print(f"Parsing file {file} ({index + 1}/{len(os.listdir(directory))})")
            data = parse_file(os.path.join(directory, file))
            
            if data:
                # Load the data into the database
                load_into_db(data)
                print(f"Successfully loaded {data['firmenbuchnummer']} into database")
        
        except Exception as e:
            print(f"Error processing file {file}: {e}")
        
        if index > 10:
            break

    print(total_data)