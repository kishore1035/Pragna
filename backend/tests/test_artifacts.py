from app.db import init_db, get_connection
from app import repository
from app.artifact_service import extract_and_save_artifacts


def make_conn(tmp_path):
    db_path = str(tmp_path / "pragna.db")
    init_db(db_path)
    conn = get_connection(db_path)
    repository.create_user(conn, "test@example.com", "hash")
    return conn


def test_extract_and_save_artifacts(tmp_path):
    conn = make_conn(tmp_path)
    cid = repository.create_conversation(conn, "Artifact Test", 1)
    mid = repository.add_message(conn, cid, "assistant", "Here is your script:")

    content = (
        'Here is the script:\n\n'
        '```artifact title="Calculate Sum" language="python"\n'
        'def sum_list(items):\n'
        '    return sum(items)\n'
        '```\n\n'
        'Hope that helps!'
    )

    ids = extract_and_save_artifacts(conn, mid, content)
    assert len(ids) == 1

    art = repository.get_artifact(conn, ids[0])
    assert art["title"] == "Calculate Sum"
    assert art["language"] == "python"
    assert "def sum_list" in art["content"]


def test_extract_artifacts_fallback_title(tmp_path):
    conn = make_conn(tmp_path)
    cid = repository.create_conversation(conn, "Artifact Test 2", 1)
    mid = repository.add_message(conn, cid, "assistant", "Untitled artifact")

    content = "```artifact\nsome plain text content\n```"
    ids = extract_and_save_artifacts(conn, mid, content)
    assert len(ids) == 1

    art = repository.get_artifact(conn, ids[0])
    assert art["title"] == "Untitled"
    assert art["content"] == "some plain text content"


def test_artifacts_api_route(client):
    conn = client.app.state.conn
    cid = repository.create_conversation(conn, "API Test", 1)
    mid = repository.add_message(conn, cid, "assistant", "msg")
    art_id = repository.create_artifact(conn, mid, "Doc", "markdown", "# Hello")

    res = client.get(f"/api/artifacts/{art_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Doc"
    assert data["content"] == "# Hello"

    res_404 = client.get("/api/artifacts/99999")
    assert res_404.status_code == 404
