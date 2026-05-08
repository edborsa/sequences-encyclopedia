import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg import connect
from psycopg.rows import dict_row

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://oeis:oeis@localhost:5433/oeis",
)

app = Flask(__name__)
CORS(app)

MAX_SEARCH_TERM_LENGTH = 100
SEARCH_LIMIT = 100
DEFAULT_LIMIT = 200

SEQUENCE_COLUMNS = "sequence_number, oeis_id, name, data, keywords, offset_value"


def query(sql, params=()):
    with connect(DATABASE_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def shape(row):
    data = row["data"] or ""
    return {
        "id": row["oeis_id"],
        "number": row["sequence_number"],
        "name": row["name"],
        "data": data,
        "terms": [term for term in data.split(",") if term],
        "keywords": row["keywords"],
        "offset": row["offset_value"],
    }


def normalize_search_term(value):
    return (value or "").strip()[:MAX_SEARCH_TERM_LENGTH]


def escape_like(value):
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def normalize_prefix_probe(value):
    return value if value.upper().startswith("A") else f"A{value}"


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/sequences")
def sequences():
    search_term = normalize_search_term(request.args.get("q", ""))

    if search_term:
        substring_pattern = f"%{escape_like(search_term)}%"
        prefix_pattern = f"{escape_like(normalize_prefix_probe(search_term))}%"
        rows = query(
            f"""
            select {SEQUENCE_COLUMNS}
            from oeis_sequences
            where name ilike %s escape '\\'
               or oeis_id ilike %s escape '\\'
            order by
              case when oeis_id ilike %s escape '\\' then 0 else 1 end,
              name
            limit %s
            """,
            (substring_pattern, substring_pattern, prefix_pattern, SEARCH_LIMIT),
        )
    else:
        rows = query(
            f"""
            select {SEQUENCE_COLUMNS}
            from oeis_sequences
            order by name
            limit %s
            """,
            (DEFAULT_LIMIT,),
        )
    return jsonify([shape(row) for row in rows])


@app.get("/sequences/<sequence_id>")
def sequence(sequence_id):
    sequence_id = sequence_id.upper()
    rows = query(
        f"""
        select {SEQUENCE_COLUMNS}
        from oeis_sequences
        where oeis_id = %s
        limit 1
        """,
        (sequence_id,),
    )
    if not rows:
        return {"error": "not found"}, 404
    return jsonify(shape(rows[0]))


if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "5053")), debug=True)
