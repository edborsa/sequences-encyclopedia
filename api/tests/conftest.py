import os

import psycopg
import pytest

import api.app as app_module
from api.app import app as flask_app

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://oeis:oeis@localhost:5433/oeis",
)

TEST_SEQ_RANGE_START = 9_000_001

FIXTURE_ROWS = [
    # (sequence_number, oeis_id, name, data, keywords, offset_value)
    (9_000_001, "A9000001", "Alpha test sequence", "2,3,5,7", "easy", "1"),
    (9_000_002, "A9000002", "Bravo with trailing comma", "1,2,", None, None),
    (9_000_003, "A9000003", "Charlie empty data", "", None, "0"),
    (9_000_004, "A9000004", "Reference to 9001055 in title", "9,0,0,1,0,5,5", "meta", "2"),
    (9_001_055, "A9001055", "Exact id target", "4,8,15,16,23,42", "id", "1"),
]


def ensure_table(conn):
    conn.execute(
        """
        create table if not exists oeis_sequences (
          sequence_number integer primary key,
          oeis_id text not null unique,
          name text not null,
          data text not null,
          keywords text,
          offset_value text,
          raw jsonb not null,
          fetched_at timestamptz not null default now()
        )
        """
    )


@pytest.fixture(scope="session")
def database_url():
    app_module.DATABASE_URL = DATABASE_URL
    try:
        with psycopg.connect(DATABASE_URL, connect_timeout=2) as conn:
            conn.execute("select 1")
    except Exception as exc:
        pytest.skip(f"DATABASE_URL not reachable: {exc}")
    return DATABASE_URL


@pytest.fixture(scope="module", autouse=True)
def seeded_db(database_url):
    """Insert deterministic fixture rows; remove them on teardown.

    Routes open their own psycopg connections through api.app.query(), so a
    transactional fixture would not be visible to them. Explicit insert/delete
    is the simplest correct pattern.
    """
    with psycopg.connect(database_url) as conn:
        ensure_table(conn)
        conn.execute(
            "delete from oeis_sequences where sequence_number >= %s",
            (TEST_SEQ_RANGE_START,),
        )
        for row in FIXTURE_ROWS:
            conn.execute(
                """
                insert into oeis_sequences
                  (sequence_number, oeis_id, name, data, keywords, offset_value, raw)
                values
                  (%s, %s, %s, %s, %s, %s, '{}'::jsonb)
                """,
                row,
            )
        conn.commit()
    yield FIXTURE_ROWS
    with psycopg.connect(database_url) as conn:
        conn.execute(
            "delete from oeis_sequences where sequence_number >= %s",
            (TEST_SEQ_RANGE_START,),
        )
        conn.commit()


@pytest.fixture()
def client():
    flask_app.testing = True
    with flask_app.test_client() as c:
        yield c
