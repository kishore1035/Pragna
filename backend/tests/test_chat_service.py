import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from app.db import init_db, get_connection
from app.chat_service import generate_reply, ALLOWED_MODELS
from app import repository


def make_conn(tmp_path):
    db_path = str(tmp_path / "mimir.db")
    init_db(db_path)
    conn = get_connection(db_path)
    repository.create_user(conn, "test@example.com", "hash")
    return conn


class FakeSettings:
    embed_model = "test-embed"
    ollama_url = "http://fake"
    rag_similarity_threshold = 0.5


class FakeCollection:
    def count(self):
        return 0


MODEL = next(iter(ALLOWED_MODELS))


async def _fake_chat_stream_events(messages, model, ollama_url, tools=None):
    for token in ["Hel", "lo", "!"]:
        yield {"type": "content", "content": token}
    yield {"type": "done"}


async def test_generate_reply_creates_conversation_and_persists_messages(tmp_path):
    conn = make_conn(tmp_path)
    with patch("app.chat_service.chat_stream_events", new=_fake_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        events = [
            event
            async for event in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "hi there", MODEL, user_id=1
            )
        ]

    token_events = [e for e in events if e["type"] == "token"]
    done_events = [e for e in events if e["type"] == "done"]
    assert "".join(e["content"] for e in token_events) == "Hello!"
    assert len(done_events) == 1
    assert done_events[0]["model"] == MODEL
    conversation_id = done_events[0]["conversation_id"]

    messages = repository.list_messages(conn, conversation_id)
    assert [m["role"] for m in messages] == ["user", "assistant"]
    assert messages[1]["content"] == "Hello!"
    assert messages[1]["model"] == MODEL
    assert messages[1]["parent_id"] == messages[0]["id"]


async def test_generate_reply_rejects_unknown_model(tmp_path):
    conn = make_conn(tmp_path)
    events = [
        event
        async for event in generate_reply(
            conn, FakeCollection(), FakeSettings(), None, "hi", "not-a-real-model", user_id=1
        )
    ]
    assert events == [{"type": "error", "message": "Unknown model: not-a-real-model"}]


async def test_generate_reply_includes_sources_when_retrieval_hits(tmp_path):
    conn = make_conn(tmp_path)
    fake_sources = [{"document_id": 1, "filename": "x.txt", "snippet": "..."}]
    with patch("app.chat_service.chat_stream_events", new=_fake_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=fake_sources)
    ):
        events = [
            event
            async for event in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "what is x?", MODEL, user_id=1
            )
        ]

    done_event = next(e for e in events if e["type"] == "done")
    assert done_event["sources"] == fake_sources


async def test_generate_reply_edit_creates_sibling_not_child_of_active_leaf(tmp_path):
    conn = make_conn(tmp_path)
    with patch("app.chat_service.chat_stream_events", new=_fake_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        first_events = [
            event
            async for event in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "original question", MODEL, user_id=1
            )
        ]
        conversation_id = next(e for e in first_events if e["type"] == "done")["conversation_id"]
        original_user_message = repository.list_messages(conn, conversation_id)[0]

        # Edit: new user text, explicit parent_id = the original message's parent (None here)
        edit_events = [
            event
            async for event in generate_reply(
                conn,
                FakeCollection(),
                FakeSettings(),
                conversation_id,
                "edited question",
                MODEL,
                parent_id=original_user_message["parent_id"],
                user_id=1,
            )
        ]

    all_messages = repository.list_messages(conn, conversation_id)
    user_messages = [m for m in all_messages if m["role"] == "user"]
    assert len(user_messages) == 2
    assert {m["parent_id"] for m in user_messages} == {None}  # both are siblings at the root

    done_event = next(e for e in edit_events if e["type"] == "done")
    conversation = repository.get_conversation(conn, conversation_id)
    assert conversation["active_leaf_id"] == done_event["message_id"]


async def test_generate_reply_regenerate_has_no_user_message_argument(tmp_path):
    conn = make_conn(tmp_path)
    with patch("app.chat_service.chat_stream_events", new=_fake_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        first_events = [
            event
            async for event in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "question", MODEL, user_id=1
            )
        ]
        conversation_id = next(e for e in first_events if e["type"] == "done")["conversation_id"]
        user_message = repository.list_messages(conn, conversation_id)[0]

        # Regenerate: user_message=None, parent_id = the user message to reply to
        regen_events = [
            event
            async for event in generate_reply(
                conn,
                FakeCollection(),
                FakeSettings(),
                conversation_id,
                None,
                MODEL,
                parent_id=user_message["id"],
                user_id=1,
            )
        ]

    all_messages = repository.list_messages(conn, conversation_id)
    assert len([m for m in all_messages if m["role"] == "user"]) == 1  # no new user message
    assistant_messages = [m for m in all_messages if m["role"] == "assistant"]
    assert len(assistant_messages) == 2  # original + regenerated variant
    assert {m["parent_id"] for m in assistant_messages} == {user_message["id"]}

    done_event = next(e for e in regen_events if e["type"] == "done")
    assert done_event["type"] == "done"


async def test_generate_reply_no_user_message_and_no_parent_yields_error(tmp_path):
    conn = make_conn(tmp_path)
    conversation_id = repository.create_conversation(conn, "Empty", 1)
    events = [
        event
        async for event in generate_reply(
            conn, FakeCollection(), FakeSettings(), conversation_id, None, MODEL, user_id=1
        )
    ]
    assert events == [{"type": "error", "message": "No message to generate a reply for."}]


async def test_generate_reply_persists_partial_content_on_task_cancellation(tmp_path):
    conn = make_conn(tmp_path)

    async def slow_chat_stream_events(messages, model, ollama_url, tools=None):
        yield {"type": "content", "content": "partial "}
        yield {"type": "content", "content": "response"}
        yield {"type": "content", "content": " that never finishes"}

    with patch("app.chat_service.chat_stream_events", new=slow_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        gen = generate_reply(conn, FakeCollection(), FakeSettings(), None, "hi", MODEL, user_id=1)
        await gen.__anext__()
        with pytest.raises(asyncio.CancelledError):
            await gen.athrow(asyncio.CancelledError())

    conversations = repository.list_conversations(conn, 1)
    messages = repository.list_messages(conn, conversations[0]["id"])
    assert messages[-1]["role"] == "assistant"
    assert messages[-1]["content"] != ""


async def test_generate_reply_yields_error_on_ollama_failure(tmp_path):
    import httpx

    conn = make_conn(tmp_path)

    async def failing_chat_stream_events(messages, model, ollama_url, tools=None):
        raise httpx.ConnectError("connection refused")
        yield  # pragma: no cover - makes this an async generator

    with patch("app.chat_service.chat_stream_events", new=failing_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        events = [
            event
            async for event in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "hi", MODEL, user_id=1
            )
        ]

    assert events[-1]["type"] == "error"


async def test_generate_reply_scrubs_malformed_text_after_image_tool(tmp_path):
    """gemma4:cloud was observed to sometimes echo a malformed pseudo tool-call
    ({"action": ..., "action_input": ...}) as its reply text in the round right
    after generate_image/edit_image succeeds. That round is buffered instead
    of streamed live specifically so this pattern can be swapped for the
    tool's own clean summary before the user ever sees it."""
    conn = make_conn(tmp_path)
    call_count = {"n": 0}

    async def fake_stream_events(messages, model, ollama_url, tools=None):
        call_count["n"] += 1
        if call_count["n"] == 1:
            yield {
                "type": "tool_calls",
                "tool_calls": [
                    {"function": {"name": "generate_image", "arguments": {"prompt": "a fox"}}}
                ],
            }
        else:
            yield {
                "type": "content",
                "content": '{\n  "action": "generate_image",\n  "action_input": "{\'prompt\': \'a fox\'}"\n}',
            }

    fake_tool_result = {
        "success": True,
        "prompt": "a fox",
        "summary": "Generated an image of: a fox",
        "image_base64": "ZmFrZQ==",
    }

    with patch("app.chat_service.chat_stream_events", new=fake_stream_events), patch(
        "app.chat_service.execute_tool", new=AsyncMock(return_value=fake_tool_result)
    ), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ), patch(
        "app.chat_service.retrieve_memories", new=AsyncMock(return_value=[])
    ):
        events = [
            e async for e in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "make an image of a fox", MODEL, user_id=1
            )
        ]

    token_events = [e for e in events if e["type"] == "token"]
    final_text = "".join(e["content"] for e in token_events)
    assert final_text == "Generated an image of: a fox"
    assert "action_input" not in final_text
    # Buffered rounds arrive as one token event, not streamed piecemeal.
    assert len(token_events) == 1

    done_event = next(e for e in events if e["type"] == "done")
    message = repository.get_message(conn, done_event["message_id"])
    assert message["content"] == "Generated an image of: a fox"


async def test_generate_reply_system_prompt_includes_current_time(tmp_path):
    conn = make_conn(tmp_path)
    captured_messages = []

    async def capturing_chat_stream_events(messages, model, ollama_url, tools=None):
        captured_messages.extend(messages)
        yield {"type": "content", "content": "ok"}
        yield {"type": "done"}

    with patch("app.chat_service.chat_stream_events", new=capturing_chat_stream_events), patch(
        "app.chat_service.retrieve", new=AsyncMock(return_value=[])
    ):
        [
            event
            async for event in generate_reply(
                conn, FakeCollection(), FakeSettings(), None, "what time is it", MODEL, user_id=1
            )
        ]

    system_message = next(m for m in captured_messages if m["role"] == "system")
    assert "Current date and time:" in system_message["content"]
    assert "UTC" in system_message["content"]
