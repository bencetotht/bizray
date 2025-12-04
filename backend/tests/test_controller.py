from datetime import date
from src.controller import get_company_by_id, search_companies
from src.db import Company, Address, Partner, RegistryEntry

# Commented out: Requires active connection to production database/external API
# def test_get_company_by_id_found(test_db_session):
#     company_to_create = Company(
#         firmenbuchnummer = "12345a",
#         name = "Test GmbH",
#         legal_form = "Gesellschaft mit beschränkter Haftung",
#         address = Address(city="Vienna"),
#         partners = [
#             Partner(name = "Maria Mustermann", birth_date = date(1980, 5, 10)),
#             Partner(name = "Max Mustermann", birth_date = date(1975, 1, 1))
#         ],
#         registry_entries = [RegistryEntry(court = "Handelsgericht Wien")]
#     )
#     test_db_session.add(company_to_create)
#     test_db_session.commit()
#
#     result_dict = get_company_by_id("12345a", session=test_db_session)
#
#     assert result_dict is not None
#     assert result_dict["name"] == "Test GmbH"
#     assert result_dict["address"]["city"] == "Vienna"
#     assert len(result_dict["partners"]) == 2
#     assert result_dict["partners"][0]["name"] == "Maria Mustermann"
#     assert result_dict["partners"][0]["birth_date"] == "1980-05-10"


# Commented out: Requires active connection to production database/external API
# def test_get_company_by_id_not_found(test_db_session):
#     result = get_company_by_id("9999z", session=test_db_session)
#     assert result is None


def test_search_companies_pagination_query(test_db_session):
    #Tests the search functionality, including filtering and pagination.
    test_db_session.add_all([
        Company(firmenbuchnummer = "111a", name = "Apple Computer Inc.", seat = "California"),
        Company(firmenbuchnummer = "222b", name = "Microsoft Inc.", seat = "Washington"),
        Company(firmenbuchnummer = "333c", name = "Pineapple Express Corp.", seat = "California")
    ])
    test_db_session.commit()

    search_result = search_companies(query="apple", page = 1, page_size=10, session=test_db_session)

    assert isinstance(search_result, dict)
    assert "results" in search_result
    companies_found = search_result["results"]
    assert len(companies_found) == 2  #apple and pineapple :))
    assert companies_found[0]["name"] == "Apple Computer Inc."
    assert companies_found[1]["name"] == "Pineapple Express Corp."
    assert "partners" not in companies_found[0]

def test_search_companies_returns_empty_when_no_match(test_db_session):
    test_db_session.add(Company(firmenbuchnummer = "111a", name = "Test Inc."))
    test_db_session.commit()

    search_result = search_companies(query="nonexistent", session=test_db_session)

    assert len(search_result["results"]) == 0