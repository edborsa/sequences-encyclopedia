from api.app import shape


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"ok": True}


def test_sequences_lists_seeded_rows_in_name_order(client):
    response = client.get("/sequences")
    assert response.status_code == 200

    payload = response.get_json()
    seeded_ids = {"A9000001", "A9000002", "A9000003", "A9000004", "A9001055"}
    filtered_ids = [row["id"] for row in payload if row["id"] in seeded_ids]

    assert filtered_ids == ["A9000001", "A9000002", "A9000003", "A9001055", "A9000004"]


def test_sequences_searches_name_substrings_and_trims_whitespace(client):
    response = client.get("/sequences?q=%20%20bravo%20%20")
    assert response.status_code == 200
    assert response.get_json() == [
        {
            "id": "A9000002",
            "number": 9_000_002,
            "name": "Bravo with trailing comma",
            "data": "1,2,",
            "terms": ["1", "2"],
            "keywords": None,
            "offset": None,
        }
    ]


def test_sequences_searches_exact_oeis_id(client):
    response = client.get("/sequences?q=A9001055")
    assert response.status_code == 200
    assert response.get_json() == [
        {
            "id": "A9001055",
            "number": 9_001_055,
            "name": "Exact id target",
            "data": "4,8,15,16,23,42",
            "terms": ["4", "8", "15", "16", "23", "42"],
            "keywords": "id",
            "offset": "1",
        }
    ]


def test_sequences_normalizes_id_prefix_searches_and_ranks_them_first(client):
    response = client.get("/sequences?q=9001055")
    assert response.status_code == 200

    payload = response.get_json()
    ids = [row["id"] for row in payload]

    assert ids[0] == "A9001055"
    assert "A9000004" in ids


def test_sequences_escape_wildcard_searches(client):
    response = client.get("/sequences?q=90010_5")
    assert response.status_code == 200
    assert response.get_json() == []


def test_sequences_returns_empty_list_for_unmatched_search(client):
    response = client.get("/sequences?q=does-not-exist")
    assert response.status_code == 200
    assert response.get_json() == []


def test_sequence_by_id_returns_single_row(client):
    response = client.get("/sequences/A9000001")
    assert response.status_code == 200
    assert response.get_json()["id"] == "A9000001"


def test_sequence_id_lookup_normalizes_to_uppercase(client):
    response = client.get("/sequences/a9000001")
    assert response.status_code == 200
    assert response.get_json()["id"] == "A9000001"


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
