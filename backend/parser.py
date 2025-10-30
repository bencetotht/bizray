import xml.etree.ElementTree as ET
import json
import os
from tqdm import tqdm

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
    directory = '/Users/bencetoth/Downloads/bizrayds/node0/data1/fbp/appl_java/gesamtstand/auszuegeKurz/'
    total_data = []
    for index, file in tqdm(enumerate(os.listdir(directory)), total=len(os.listdir(directory))):
        try:
            if not file.endswith('.xml'):
                continue
            print(f"Parsing file {file} ({index + 1}/{len(os.listdir(directory))})")
            data = parse_file(os.path.join(directory, file))
            json_data = json.dumps(data, indent=2, ensure_ascii=False)
            print(json_data)
            total_data.append(json_data)
        except Exception as e:
            print(f"Error parsing file {file}: {e}")
        
        if index > 10:
            break

    print(total_data)