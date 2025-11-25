import xml.etree.ElementTree as ET
import json
import os
import math
import itertools
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime
from typing import Iterator, List, Dict, Any

from tqdm import tqdm
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from src.db import (
    get_session,
    Company,
    Address,
    Partner,
    RegistryEntry,
    init_db,
    engine,
)

ns = {"ns1": "ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugResponse"}

def get_text(element, path):
    node = element.find(path, ns)
    return node.text.strip() if node is not None and node.text else None

def parse_date(date_string):
    if not date_string:
        return None
    for fmt in ("%Y%m%d", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_string, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format: {date_string}")

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
            reference_date=parse_date(data["reference_date"]) if data["reference_date"] else None
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
                application_date=parse_date(entry_data["application_date"]) if entry_data["application_date"] else None,
                registration_date=parse_date(entry_data["registration_date"]) if entry_data["registration_date"] else None
            )
            company.registry_entries.append(entry)

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
        with open(file_path, encoding='utf-8') as f:
            xml_string = f.read()
            root = ET.fromstring(xml_string)
            data = parse_entry(root)
            data["partners"] = parse_partners(root)
            data["registry_entries"] = parse_registry_entries(root)
            return data
    except Exception as e:
        print(f"Error parsing file {file_path}: {e}")
        return None

def _iter_xml_files(root_dir: str) -> Iterator[str]:
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for name in filenames:
            if name.endswith('.xml'):
                yield os.path.join(dirpath, name)

def _chunked(iterable: Iterator[Any], size: int) -> Iterator[List[Any]]:
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, size))
        if not chunk:
            return
        yield chunk

def _normalize_company_row(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "firmenbuchnummer": data["firmenbuchnummer"],
        "name": data["name"],
        "legal_form": data.get("legal_form"),
        "business_purpose": data.get("business_purpose"),
        "seat": data.get("seat"),
        "reference_date": parse_date(data.get("reference_date")) if data.get("reference_date") else None,
    }


def _normalize_children_rows(data: Dict[str, Any], company_id: int) -> Dict[str, List[Dict[str, Any]]]:
    children: Dict[str, List[Dict[str, Any]]] = {
        "addresses": [],
        "partners": [],
        "registry_entries": [],
    }

    addr = data.get("address") or {}
    if any(addr.values()):
        children["addresses"].append({
            "company_id": company_id,
            "street": addr.get("street"),
            "house_number": addr.get("house_number"),
            "postal_code": addr.get("postal_code"),
            "city": addr.get("city"),
            "country": addr.get("country"),
        })

    for p in data.get("partners", []):
        # Parse malformed date strings
        birth_date_val = None
        if p.get("birth_date"):
            try:
                birth_date_val = parse_date(p["birth_date"])  # supports YYYYMMDD and YYYY-MM-DD
            except Exception:
                birth_date_val = None
        children["partners"].append({
            "company_id": company_id,
            "name": p.get("name"),
            "first_name": p.get("first_name"),
            "last_name": p.get("last_name"),
            "birth_date": birth_date_val,
            "role": p.get("role"),
            "representation": p.get("representation"),
        })

    for r in data.get("registry_entries", []):
        children["registry_entries"].append({
            "company_id": company_id,
            "type": r.get("type"),
            "court": r.get("court"),
            "file_number": r.get("file_number"),
            "application_date": parse_date(r.get("application_date")) if r.get("application_date") else None,
            "registration_date": parse_date(r.get("registration_date")) if r.get("registration_date") else None,
        })

    return children

def _batch_write(parsed_batch: List[Dict[str, Any]]) -> int:
    if not parsed_batch:
        return 0

    companies_rows = [_normalize_company_row(d) for d in parsed_batch]

    with engine.begin() as conn:
        stmt = pg_insert(Company.__table__).values(companies_rows)
        upsert = stmt.on_conflict_do_update(
            index_elements=[Company.__table__.c.firmenbuchnummer],
            set_={
                "name": stmt.excluded.name,
                "legal_form": stmt.excluded.legal_form,
                "business_purpose": stmt.excluded.business_purpose,
                "seat": stmt.excluded.seat,
                "reference_date": stmt.excluded.reference_date,
            },
        ).returning(Company.__table__.c.id, Company.__table__.c.firmenbuchnummer)

        result = conn.execute(upsert)
        id_rows = result.fetchall()
        fnr_to_id = {row.firmenbuchnummer: row.id for row in id_rows}

        # Ensure we have IDs for any rows that might have been inserted earlier concurrently
        missing_fnrs = [r["firmenbuchnummer"] for r in companies_rows if r["firmenbuchnummer"] not in fnr_to_id]
        if missing_fnrs:
            sel = select(Company.__table__.c.id, Company.__table__.c.firmenbuchnummer).where(Company.__table__.c.firmenbuchnummer.in_(missing_fnrs))
            for row in conn.execute(sel):
                fnr_to_id[row.firmenbuchnummer] = row.id

        company_ids = list({fnr_to_id[d["firmenbuchnummer"]] for d in parsed_batch})

        # Delete existing children for idempotent reload
        if company_ids:
            conn.execute(delete(Address.__table__).where(Address.__table__.c.company_id.in_(company_ids)))
            conn.execute(delete(Partner.__table__).where(Partner.__table__.c.company_id.in_(company_ids)))
            conn.execute(delete(RegistryEntry.__table__).where(RegistryEntry.__table__.c.company_id.in_(company_ids)))

        # Prepare children rows and bulk insert
        addr_rows: List[Dict[str, Any]] = []
        partner_rows: List[Dict[str, Any]] = []
        reg_rows: List[Dict[str, Any]] = []

        for d in parsed_batch:
            company_id = fnr_to_id[d["firmenbuchnummer"]]
            ch = _normalize_children_rows(d, company_id)
            addr_rows.extend(ch["addresses"])
            partner_rows.extend(ch["partners"])
            reg_rows.extend(ch["registry_entries"])

        if addr_rows:
            conn.execute(Address.__table__.insert(), addr_rows)
        if partner_rows:
            conn.execute(Partner.__table__.insert(), partner_rows)
        if reg_rows:
            conn.execute(RegistryEntry.__table__.insert(), reg_rows)

    return len(parsed_batch)

if __name__ == "__main__":
    init_db()

    directory = os.getenv(
        "BIZRAY_XML_DIR",
        '/Users/bencetoth/Downloads/bizrayds/node0/data1/fbp/appl_java/gesamtstand/auszuegeKurz/',
    )
    workers = int(os.getenv("BIZRAY_WORKERS", str(os.cpu_count() or 4)))
    batch_size = int(os.getenv("BIZRAY_BATCH_SIZE", "2000"))

    files_iter = _iter_xml_files(directory)
    total_files = None  # optional: could compute, but walking is expensive; tqdm will be indeterminate

    with ProcessPoolExecutor(max_workers=workers) as executor:
        # Submit in rolling windows to avoid over-queuing
        processed = 0
        with tqdm(total=total_files, unit="file") as pbar:
            for file_chunk in _chunked(files_iter, batch_size * 4):
                futures = [executor.submit(parse_file, path) for path in file_chunk]

                parsed_buffer: List[Dict[str, Any]] = []
                for fut in as_completed(futures):
                    data = fut.result()
                    if data:
                        parsed_buffer.append(data)
                    if len(parsed_buffer) >= batch_size:
                        processed += _batch_write(parsed_buffer)
                        pbar.update(len(parsed_buffer))
                        parsed_buffer.clear()

                if parsed_buffer:
                    processed += _batch_write(parsed_buffer)
                    pbar.update(len(parsed_buffer))
                    parsed_buffer.clear()

    # Final note
    print("Ingestion complete.")