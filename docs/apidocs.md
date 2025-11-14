# API Documentation

## Company information
### Search for companies
Request: `GET /api/v1/company?q=search`

Parameters:
- `q`: search query (required)
- `page`: page number (optional, default: 1)
- `page_size`: number of results per page (optional, default: 10)

Response:
```json
{
  "results": [
    {
      "firmenbuchnummer": "661613k",
      "name": "Körpermanufaktur KG",
      "legal_form": "Kommanditgesellschaft",
      "business_purpose": "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
      "seat": "Dornbirn"
    },
    {
      "firmenbuchnummer": "661613b",
      "name": "Körpermanufaktur 2",
      "legal_form": "Kommanditgesellschaft",
      "business_purpose": "Betrieb einer andere Praxis für Physiotherapie und Chiropraktik",
      "seat": "Birndorn"
    },
  ]
}
```

### Get detailed information about company
Request: `GET /api/v1/company/:id`

Parameters:
- `id`: firmenbuchnummer of the firm

Response:
```json
{
  "firmenbuchnummer": "661613k",
  "name": "Körpermanufaktur KG",
  "legal_form": "Kommanditgesellschaft",
  "address": {
    "street": "Marktstraße",
    "house_number": "36",
    "postal_code": "6850",
    "city": "Dornbirn",
    "country": "AUT"
  },
  "business_purpose": "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
  "seat": "Dornbirn",
  "partners": [
    {
      "name": "Richard Thomas Kranabetter",
      "first_name": "Richard Thomas",
      "last_name": "Kranabetter",
      "birth_date": "1991-10-20",
      "role": "UNBESCHRÄNKT HAFTENDE/R GESELLSCHAFTER/IN",
      "representation": "gemeinsame Vertretung"
    },
  ],
  "registry_entries": [
    {
      "type": "Neueintragung",
      "court": "Landesgericht Feldkirch",
      "file_number": "929 048 Fr 1456/25 y",
      "application_date": "2025-09-08",
      "registration_date": "2025-09-09"
    },
  ],
  "riskScore": 7.4,
  "riskIndicators": {
    "ind1": 8.4,
    "ind2": 4.5
  },
  "reference_date": "2025-10-01"
}
```

## Search query suggestion
Request: `GET /api/v1/search?q=search`

Parameters:
- `q`: search query (required)

Response:
```json
{
  "suggestions": [
    {
      "firmenbuchnummer": "544393d",
      "name": "13PUNKT4-Büro für Digitalisierung e.U."
    },
    {
      "firmenbuchnummer": "471530b",
      "name": "1425 Siegl Immobilien GmbH"
    },
    {
      "firmenbuchnummer": "511911k",
      "name": "17 siebzehn GmbH in Liqu."
    },
    {
      "firmenbuchnummer": "539261g",
      "name": "2752 Siedlung Tirolerbach"
    },
    {
      "firmenbuchnummer": "530232d",
      "name": "27 siebenundzwanzig GmbH in Liqu."
    },
    {
      "firmenbuchnummer": "610228w",
      "name": "2B Architektur Visualisierung OG"
    },
    {
      "firmenbuchnummer": "661319d",
      "name": "2T Automatisierung GmbH"
    },
    {
      "firmenbuchnummer": "428259v",
      "name": "31sieben Marken- &"
    },
    {
      "firmenbuchnummer": "566312m",
      "name": "37 siebenunddreißig GmbH"
    },
    {
      "firmenbuchnummer": "648356s",
      "name": "387 drei-acht-sieben Alpine GmbH"
    }
  ]
}
```

## Metrics
Request: `GET /api/v1/metrics`

Response:
```json
{
  "metrics": {
    "companies": 635169,
    "addresses": 336510,
    "partners": 514871,
    "registry_entries": 1383898,
  }
}
```

## Data Strucutre
```json
{
  "firmenbuchnummer": "661613k",
  "name": "Körpermanufaktur KG",
  "legal_form": "Kommanditgesellschaft",
  "address": {
    "street": "Marktstraße",
    "house_number": "36",
    "postal_code": "6850",
    "city": "Dornbirn",
    "country": "AUT"
  },
  "business_purpose": "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
  "seat": "Dornbirn",
  "partners": [
    {
      "name": "Richard Thomas Kranabetter",
      "first_name": "Richard Thomas",
      "last_name": "Kranabetter",
      "birth_date": "1991-10-20",
      "role": "UNBESCHRÄNKT HAFTENDE/R GESELLSCHAFTER/IN",
      "representation": "gemeinsame Vertretung"
    },
    {
      "name": "Isagani Röser",
      "first_name": "Isagani",
      "last_name": "Röser",
      "birth_date": "1981-03-23",
      "role": "UNBESCHRÄNKT HAFTENDE/R GESELLSCHAFTER/IN",
      "representation": "gemeinsame Vertretung"
    }
  ],
  "registry_entries": [
    {
      "type": "Neueintragung",
      "court": "Landesgericht Feldkirch",
      "file_number": "929 048 Fr 1456/25 y",
      "application_date": "2025-09-08",
      "registration_date": "2025-09-09"
    },
    {
      "type": "Änderung",
      "court": "Landesgericht Feldkirch",
      "file_number": "929 048 Fr 1553/25 s",
      "application_date": "2025-09-11",
      "registration_date": "2025-09-24"
    }
  ],
  "riskScore": 7.4,
  "riskIndicators": {
    "ind1": 8.4,
    "ind2": 4.5
  },
  "reference_date": "2025-10-01"
}
```
