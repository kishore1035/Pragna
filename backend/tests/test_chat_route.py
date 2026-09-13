import json
from unittest.mock import AsyncMock, patch
from app.chat_service import ALLOWED_MODELS

MODEL = next(iter(ALLOWED_MODELS))


async def _fake_chat_stream_events(messages, model, ollama_url, tools=None):
    for token in ["Hi", " there"]:
        yield {"type": "content", "content": token}
    yield {"type": "done"}


def test_chat_endpoint_streams_sse_events(client):
    with patch("app.chat_service.chat_stream_events", new=_fake_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        response = client.post(
            "/api/chat", json={"conversation_id": None, "message": "hello", "model": MODEL}
        )

    assert response.status_code == 200
    events = [
        json.loads(line[len("data: "):])
        for line in response.text.split("\n\n")
        if line.startswith("data: ")
    ]
    token_events = [e for e in events if e["type"] == "token"]
    done_events = [e for e in events if e["type"] == "done"]
    assert "".join(e["content"] for e in token_events) == "Hi there"
    assert len(done_events) == 1
    assert done_events[0]["model"] == MODEL


def test_chat_endpoint_regenerate_omits_message(client):
    conn = client.app.state.conn
    from app import repository

    conversation_id = repository.create_conversation(conn, "Test", 1)
    user_message_id = repository.add_message(conn, conversation_id, "user", "question")
    repository.add_message(
        conn, conversation_id, "assistant", "first answer", parent_id=user_message_id, model=MODEL
    )

    with patch("app.chat_service.chat_stream_events", new=_fake_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        response = client.post(
            "/api/chat",
            json={
                "conversation_id": conversation_id,
                "message": None,
                "parent_id": user_message_id,
                "model": MODEL,
            },
        )

    assert response.status_code == 200
    messages = repository.list_messages(conn, conversation_id)
    assistant_messages = [m for m in messages if m["role"] == "assistant"]
    assert len(assistant_messages) == 2
