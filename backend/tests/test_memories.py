from unittest.mock import AsyncMock, patch
from app.db import init_db, get_connection
from app import repository
from app.memory_service import extract_and_save_memory, delete_memory_record


def make_conn(tmp_path):
    db_path = str(tmp_path / "mimir.db")
    init_db(db_path)
    conn = get_connection(db_path)
    repository.create_user(conn, "test@example.com", "hash")
    return conn


class FakeSettings:
    embed_model = "nomic-embed-text"
    ollama_url = "http://fake"


async def test_extract_and_save_memory(tmp_path):
    conn = make_conn(tmp_path)
    cid = repository.create_conversation(conn, "Mem Test", 1)

    async def fake_stream(messages, model, ollama_url):
        yield "User works as a software engineer."

    with patch("app.memory_service.chat_stream", new=fake_stream), patch(
        "app.memory_service.embed", new=AsyncMock(return_value=[0.1, 0.2])
    ):
        mem_id = await extract_and_save_memory(
            conn, None, FakeSettings(), cid, "What do I do?", "You mentioned software engineering."
        )

    assert mem_id is not None
    mems = repository.list_memories(conn)
    assert len(mems) == 1
    assert mems[0]["content"] == "User works as a software engineer."


async def test_extract_none_saved(tmp_path):
    conn = make_conn(tmp_path)
    cid = repository.create_conversation(conn, "Mem Test 2", 1)

    async def fake_stream_none(messages, model, ollama_url):
        yield "NONE"

    with patch("app.memory_service.chat_stream", new=fake_stream_none):
        mem_id = await extract_and_save_memory(
            conn, None, FakeSettings(), cid, "Hi", "Hello"
        )

    assert mem_id is None
    assert len(repository.list_memories(conn)) == 0


def test_memories_api(client):
    conn = client.app.state.conn
    mid = repository.create_memory(conn, "User likes pizza.")

    res = client.get("/api/memories")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["content"] == "User likes pizza."

    del_res = client.delete(f"/api/memories/{mid}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

    res_after = client.get("/api/memories")
    assert len(res_after.json()) == 0

    del_404 = client.delete("/api/memories/9999")
    assert del_404.status_code == 404
