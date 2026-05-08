from api.app import shape


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"ok": True}


def test_sequences_lists_seeded_rows_in_name_order(client):
    response = client.get("/sequences")
    assert response.status_code == 200

    payload = response.get_json()
    seeded_ids = {"A9900001", "A9900002", "A9900003", "A9900004", "A9900005"}
    filtered_ids = [row["id"] for row in payload if row["id"] in seeded_ids]

    assert filtered_ids == [
        "A9900001",
        "A9900002",
        "A9900003",
        "A9900004",
        "A9900005",
    ]


def test_sequences_filters_by_partial_name_and_trims_whitespace(client):
    response = client.get("/sequences?q=%20%20hotglue%20fibonacci%20%20")
    assert response.status_code == 200
    assert response.get_json() == [
        {
            "id": "A9900004",
            "number": 9_900_004,
            "name": "Hotglue Fibonacci sample",
            "data": "1,1,2,3,5",
            "terms": ["1", "1", "2", "3", "5"],
            "keywords": "math",
            "offset": "0",
        },
        {
            "id": "A9900005",
            "number": 9_900_005,
            "name": "Hotglue Fibonacci variants",
            "data": "1,3,4,7",
            "terms": ["1", "3", "4", "7"],
            "keywords": None,
            "offset": None,
        },
    ]


def test_sequences_blank_search_uses_default_listing(client):
    default_response = client.get("/sequences")
    blank_response = client.get("/sequences?q=   ")

    assert blank_response.status_code == 200
    assert blank_response.get_json() == default_response.get_json()


def test_sequences_returns_empty_list_for_unmatched_search(client):
    response = client.get("/sequences?q=does-not-exist")
    assert response.status_code == 200
    assert response.get_json() == []


def test_sequence_by_id_returns_single_row(client):
    response = client.get("/sequences/A9900001")
    assert response.status_code == 200
    assert response.get_json() == {
        "id": "A9900001",
        "number": 9_900_001,
        "name": "Alpha test sequence",
        "data": "2,3,5,7",
        "terms": ["2", "3", "5", "7"],
        "keywords": "easy",
        "offset": "1",
    }


def test_sequence_id_lookup_normalizes_to_uppercase(client):
    response = client.get("/sequences/a9900001")
    assert response.status_code == 200
    assert response.get_json()["id"] == "A9900001"


def test_sequence_not_found_returns_404(client):
    response = client.get("/sequences/A0000000")
    assert response.status_code == 404
    assert response.get_json() == {"error": "not found"}


def test_shape_treats_empty_data_as_empty_string():
    row = {
        "oeis_id": "A0",
        "sequence_number": 0,
        "name": "name",
        "data": "",
        "keywords": None,
        "offset_value": None,
    }
    assert shape(row) == {
        "id": "A0",
        "number": 0,
        "name": "name",
        "data": "",
        "terms": [],
        "keywords": None,
        "offset": None,
    }


def test_shape_treats_none_data_as_empty_string():
    row = {
        "oeis_id": "A0",
        "sequence_number": 0,
        "name": "name",
        "data": None,
        "keywords": None,
        "offset_value": None,
    }
    assert shape(row)["data"] == ""
    assert shape(row)["terms"] == []


def test_shape_filters_empty_terms_from_trailing_comma():
    row = {
        "oeis_id": "A0",
        "sequence_number": 0,
        "name": "name",
        "data": "1,2,",
        "keywords": None,
        "offset_value": None,
    }
    assert shape(row)["terms"] == ["1", "2"]
