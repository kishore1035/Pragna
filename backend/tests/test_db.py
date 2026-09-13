from app.db import init_db, get_connection


def test_init_db_creates_tables(tmp_path):
    db_path = str(tmp_path / "mimir.db")
    init_db(db_path)
    conn = get_connection(db_path)
    tables = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }
    assert {"conversations", "messages", "documents"} <= tables
    conn.close()


def test_get_connection_row_factory(tmp_path):
    db_path = str(tmp_path / "mimir.db")
    init_db(db_path)
    conn = get_connection(db_path)
    conn.execute(
        "INSERT INTO conversations (title, created_at) VALUES (?, ?)",
        ("test", "2026-01-01T00:00:00"),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM conversations").fetchone()
    assert row["title"] == "test"
    conn.close()


def test_init_db_adds_user_id_to_existing_conversations_table(tmp_path):
    import sqlite3

    db_path = str(tmp_path / "mimir.db")
    # Simulate a pre-auth database: conversations table with no user_id column.
    conn = sqlite3.connect(db_path)
    conn.execute(
        "CREATE TABLE conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, created_at TEXT NOT NULL, active_leaf_id INTEGER)"
    )
    conn.execute("INSERT INTO conversations (title, created_at) VALUES ('legacy', '2026-01-01')")
    conn.commit()
    conn.close()

    init_db(db_path)

    conn = sqlite3.connect(db_path)
    columns = [row[1] for row in conn.execute("PRAGMA table_info(conversations)").fetchall()]
    assert "user_id" in columns
    row = conn.execute("SELECT user_id FROM conversations WHERE title = 'legacy'").fetchone()
    assert row[0] is None
    conn.close()


def test_init_db_makes_password_hash_nullable_and_adds_oauth_columns(tmp_path):
    import sqlite3

    db_path = str(tmp_path / "mimir.db")
    # Simulate the pre-OAuth users table: password_hash NOT NULL, no OAuth columns.
    conn = sqlite3.connect(db_path)
    conn.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, "
        "password_hash TEXT NOT NULL, created_at TEXT NOT NULL)"
    )
    conn.execute(
        "INSERT INTO users (email, password_hash, created_at) VALUES ('a@example.com', 'hash', '2026-01-01')"
    )
    conn.commit()
    conn.close()

    init_db(db_path)

    conn = sqlite3.connect(db_path)
    columns = [row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
    assert {"oauth_provider", "oauth_id", "name", "avatar_url"} <= set(columns)

    # Existing row preserved.
    row = conn.execute("SELECT email, password_hash FROM users WHERE email = 'a@example.com'").fetchone()
    assert row[0] == "a@example.com"
    assert row[1] == "hash"

    # password_hash is genuinely nullable now.
    conn.execute(
        "INSERT INTO users (email, created_at, oauth_provider, oauth_id) VALUES (?, ?, ?, ?)",
        ("b@example.com", "2026-01-01", "google", "12345"),
    )
    conn.commit()
    row2 = conn.execute("SELECT password_hash FROM users WHERE email = 'b@example.com'").fetchone()
    assert row2[0] is None
    conn.close()

