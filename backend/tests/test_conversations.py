from app.db import init_db, get_connection
from app import repository


def make_conn(tmp_path):
    db_path = str(tmp_path / "mimir.db")
    init_db(db_path)
    conn = get_connection(db_path)
    repository.create_user(conn, "test@example.com", "hash")
    return conn


def test_create_conversation_requires_user_id(tmp_path):
    conn = make_conn(tmp_path)
    user_id = repository.create_user(conn, "a@example.com", "hash")
    conversation_id = repository.create_conversation(conn, "Hello", user_id)
    conversation = repository.get_conversation(conn, conversation_id)
    assert conversation["user_id"] == user_id


def test_list_conversations_filters_by_user(tmp_path):
    conn = make_conn(tmp_path)
    user_a = repository.create_user(conn, "a@example.com", "hash")
    user_b = repository.create_user(conn, "b@example.com", "hash")
    repository.create_conversation(conn, "A's chat", user_a)
    repository.create_conversation(conn, "B's chat", user_b)

    a_conversations = repository.list_conversations(conn, user_a)
    assert [c["title"] for c in a_conversations] == ["A's chat"]


def test_create_user_and_lookup(tmp_path):
    conn = make_conn(tmp_path)
    user_id = repository.create_user(conn, "lookup@example.com", "hashed-pw")
    assert repository.get_user(conn, user_id)["email"] == "lookup@example.com"
    assert repository.get_user_by_email(conn, "lookup@example.com")["id"] == user_id
    assert repository.get_user_by_email(conn, "nobody@example.com") is None
    assert repository.count_users(conn) == 2


def test_assign_ownerless_conversations(tmp_path):
    conn = make_conn(tmp_path)
    # Simulate pre-auth conversations: insert directly, bypassing create_conversation
    # (which now requires user_id), matching what the legacy DB actually looks like.
    conn.execute(
        "INSERT INTO conversations (title, created_at) VALUES ('legacy 1', '2026-01-01')"
    )
    conn.execute(
        "INSERT INTO conversations (title, created_at) VALUES ('legacy 2', '2026-01-01')"
    )
    conn.commit()

    user_id = repository.create_user(conn, "first@example.com", "hash")
    updated = repository.assign_ownerless_conversations(conn, user_id)

    assert updated == 2
    for c in repository.list_conversations(conn, user_id):
        assert c["title"] in ("legacy 1", "legacy 2")


def test_create_and_get_conversation(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Hello world", 1)
    conversation = repository.get_conversation(conn, conversation_id)
    assert conversation["title"] == "Hello world"


def test_list_conversations_ordered_newest_first(tmp_path):
    conn = make_conn(tmp_path)
    first_id = repository.create_conversation(conn, "First", 1)
    second_id = repository.create_conversation(conn, "Second", 1)
    conversations = repository.list_conversations(conn, 1)
    assert [c["id"] for c in conversations] == [second_id, first_id]


def test_list_conversations_search_matches_title_or_message(tmp_path):
    conn = make_conn(tmp_path)
    match_id = repository.create_conversation(conn, "About penguins", 1)
    other_id = repository.create_conversation(conn, "About cars", 1)
    repository.add_message(conn, other_id, "user", "tell me about penguins please")

    results = repository.list_conversations(conn, 1, query="penguins")
    result_ids = {c["id"] for c in results}
    assert match_id in result_ids
    assert other_id in result_ids


def test_rename_conversation(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Old title", 1)
    updated = repository.rename_conversation(conn, conversation_id, "New title")
    assert updated is True
    assert repository.get_conversation(conn, conversation_id)["title"] == "New title"


def test_rename_missing_conversation_returns_false(tmp_path):
    conn = make_conn(tmp_path)
    assert repository.rename_conversation(conn, 999, "New title") is False


def test_add_and_list_messages_with_sources(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Doc chat", 1)
    repository.add_message(conn, conversation_id, "user", "What is X?")
    sources = [{"document_id": 1, "filename": "x.txt", "snippet": "X is..."}]
    repository.add_message(conn, conversation_id, "assistant", "X is a thing.", sources=sources)

    messages = repository.list_messages(conn, conversation_id)
    assert len(messages) == 2
    assert messages[0]["sources"] is None
    assert messages[1]["sources"] == sources


def test_conversations_api_list_get_rename(client):
    conn = client.app.state.conn
    conversation_id = repository.create_conversation(conn, "Route test", 1)

    list_response = client.get("/api/conversations")
    assert list_response.status_code == 200
    assert any(c["id"] == conversation_id for c in list_response.json())

    get_response = client.get(f"/api/conversations/{conversation_id}")
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Route test"
    assert get_response.json()["messages"] == []

    rename_response = client.patch(
        f"/api/conversations/{conversation_id}", json={"title": "Renamed"}
    )
    assert rename_response.status_code == 200
    assert rename_response.json()["title"] == "Renamed"


def test_get_missing_conversation_404(client):
    response = client.get("/api/conversations/999")
    assert response.status_code == 404


def test_rename_missing_conversation_404(client):
    response = client.patch("/api/conversations/999", json={"title": "x"})
    assert response.status_code == 404


def test_search_query_param(client):
    conn = client.app.state.conn
    repository.create_conversation(conn, "Zebra facts", 1)
    response = client.get("/api/conversations", params={"q": "zebra"})
    assert response.status_code == 200
    assert any(c["title"] == "Zebra facts" for c in response.json())


def test_set_active_leaf_via_api(client):
    conn = client.app.state.conn
    conversation_id = repository.create_conversation(conn, "Branch test", 1)
    root = repository.add_message(conn, conversation_id, "user", "first")
    branch_a = repository.add_message(conn, conversation_id, "assistant", "A", parent_id=root)
    repository.add_message(conn, conversation_id, "assistant", "B", parent_id=root)

    response = client.post(
        f"/api/conversations/{conversation_id}/active-leaf", json={"message_id": branch_a}
    )

    assert response.status_code == 200
    assert response.json() == {"conversation_id": conversation_id, "active_leaf_id": branch_a}


def test_set_active_leaf_rejects_foreign_message(client):
    conn = client.app.state.conn
    conversation_a = repository.create_conversation(conn, "A", 1)
    conversation_b = repository.create_conversation(conn, "B", 1)
    message_in_b = repository.add_message(conn, conversation_b, "user", "hi")

    response = client.post(
        f"/api/conversations/{conversation_a}/active-leaf", json={"message_id": message_in_b}
    )

    assert response.status_code == 404


def test_get_conversation_includes_active_leaf_id(client):
    conn = client.app.state.conn
    conversation_id = repository.create_conversation(conn, "Test", 1)
    message_id = repository.add_message(conn, conversation_id, "user", "hi")

    response = client.get(f"/api/conversations/{conversation_id}")

    assert response.json()["active_leaf_id"] == message_id

