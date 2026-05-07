import os

import psycopg
import pytest

import api.app as app_module
from api.app import app as flask_app

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://oeis:oeis@localhost:5433/oeis",
)

TEST_SEQ_RANGE_START = 9_900_001

FIXTURE_ROWS = [
    # (sequence_number, oeis_id, name, data, keywords, offset_value)
    (9_900_001, "A9900001", "Alpha test sequence", "2,3,5,7", "easy", "1"),
    (9_900_002, "A9900002", "Bravo with trailing comma", "1,2,", None, None),
    (9_900_003, "A9900003", "Charlie empty data", "", None, "0"),
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
    # Routes open separate connections, so inserted fixture rows are the
    # simplest way to make deterministic test data visible to the app.
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
    with flask_app.test_client() as client:
        yield client
