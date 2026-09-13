from app.db import init_db, get_connection
from app import repository


def make_conn(tmp_path):
    db_path = str(tmp_path / "mimir.db")
    init_db(db_path)
    conn = get_connection(db_path)
    repository.create_user(conn, "test@example.com", "hash")
    return conn


def test_add_message_sets_active_leaf(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Test", 1)
    message_id = repository.add_message(conn, conversation_id, "user", "hi", parent_id=None)
    conversation = repository.get_conversation(conn, conversation_id)
    assert conversation["active_leaf_id"] == message_id


def test_get_message_returns_full_row(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Test", 1)
    message_id = repository.add_message(
        conn, conversation_id, "assistant", "hello", model="gemma4:cloud"
    )
    message = repository.get_message(conn, message_id)
    assert message["content"] == "hello"
    assert message["model"] == "gemma4:cloud"
    assert message["parent_id"] is None


def test_get_message_missing_returns_none(tmp_path):
    conn = make_conn(tmp_path)
    assert repository.get_message(conn, 999) is None


def test_get_path_to_root_walks_parent_chain(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Test", 1)
    root = repository.add_message(conn, conversation_id, "user", "first")
    reply = repository.add_message(conn, conversation_id, "assistant", "second", parent_id=root)
    followup = repository.add_message(conn, conversation_id, "user", "third", parent_id=reply)

    path = repository.get_path_to_root(conn, followup)

    assert [m["content"] for m in path] == ["first", "second", "third"]
    assert [m["id"] for m in path] == [root, reply, followup]


def test_get_path_to_root_ignores_other_branches(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Test", 1)
    root = repository.add_message(conn, conversation_id, "user", "first")
    branch_a = repository.add_message(conn, conversation_id, "assistant", "branch A", parent_id=root)
    branch_b = repository.add_message(conn, conversation_id, "assistant", "branch B", parent_id=root)

    path_a = repository.get_path_to_root(conn, branch_a)
    path_b = repository.get_path_to_root(conn, branch_b)

    assert [m["content"] for m in path_a] == ["first", "branch A"]
    assert [m["content"] for m in path_b] == ["first", "branch B"]


def test_set_active_leaf_updates_conversation(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Test", 1)
    root = repository.add_message(conn, conversation_id, "user", "first")
    branch_a = repository.add_message(conn, conversation_id, "assistant", "A", parent_id=root)
    branch_b = repository.add_message(conn, conversation_id, "assistant", "B", parent_id=root)

    updated = repository.set_active_leaf(conn, conversation_id, branch_a)

    assert updated is True
    assert repository.get_conversation(conn, conversation_id)["active_leaf_id"] == branch_a


def test_set_active_leaf_rejects_message_from_other_conversation(tmp_path):
    conn = make_conn(tmp_path)
    conversation_a = repository.create_conversation(conn, "A", 1)
    conversation_b = repository.create_conversation(conn, "B", 1)
    message_in_b = repository.add_message(conn, conversation_b, "user", "hi")

    updated = repository.set_active_leaf(conn, conversation_a, message_in_b)

    assert updated is False


def test_list_messages_includes_parent_id_and_model(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Test", 1)
    root = repository.add_message(conn, conversation_id, "user", "first")
    repository.add_message(conn, conversation_id, "assistant", "reply", parent_id=root, model="gemma4:cloud")

    messages = repository.list_messages(conn, conversation_id)

    assert messages[0]["parent_id"] is None
    assert messages[1]["parent_id"] == root
    assert messages[1]["model"] == "gemma4:cloud"
