import logging
import re
import uuid
import chromadb
from app.config import Settings
from app import repository
from app.ollama_client import embed, chat_stream

logger = logging.getLogger("mimir.memory")

EXTRACTION_SYSTEM_PROMPT = (
    "You are a memory extraction assistant. Given a recent conversation exchange, "
    "determine if there is a durable, personal fact or preference about the user worth remembering long-term. "
    "If yes, state the fact concisely as a single standalone sentence (e.g. 'User prefers dark mode', 'User works as a software engineer in Chicago'). "
    "If no, respond with ONLY the word NONE."
)


def get_memories_chroma_collection(settings: Settings):
    client = chromadb.PersistentClient(path=settings.chroma_path)
    return client.get_or_create_collection(
        name="memories", metadata={"hnsw:space": "cosine"}
    )


async def extract_and_save_memory(
    conn,
    memories_collection,
    settings: Settings,
    conversation_id: int,
    user_message: str | None,
    assistant_message: str | None,
) -> int | None:
    if not user_message or not assistant_message:
        return None

    prompt_messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {"role": "user", "content": f"User: {user_message}\nAssistant: {assistant_message}"},
    ]

    # Always use fixed fast cloud model per spec
    model = "gemma4:cloud"
    extracted_text = ""

    try:
        async for token in chat_stream(prompt_messages, model, settings.ollama_url):
            extracted_text += token
    except Exception as e:
        logger.warning(f"Memory extraction model call failed: {e}")
        return None

    cleaned = extracted_text.strip()
    if not cleaned or cleaned.upper() == "NONE" or "NONE" in cleaned.upper() and len(cleaned) < 10:
        return None

    # Strip any quote wrapping if present
    if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
        cleaned = cleaned[1:-1].strip()

    try:
        memory_id = repository.create_memory(conn, cleaned, source_conversation_id=conversation_id)
        if memories_collection is not None:
            vector = await embed(cleaned, settings.embed_model, settings.ollama_url)
            memories_collection.add(
                ids=[str(memory_id)],
                embeddings=[vector],
                documents=[cleaned],
                metadatas=[{"memory_id": memory_id, "conversation_id": conversation_id}],
            )
        return memory_id
    except Exception as e:
        logger.warning(f"Failed to persist extracted memory: {e}")
        return None


async def retrieve_memories(
    query: str,
    memories_collection,
    embed_model: str,
    ollama_url: str,
    top_k: int = 3,
    threshold: float = 0.5,
) -> list[str]:
    if memories_collection is None or memories_collection.count() == 0:
        return []

    try:
        query_embedding = await embed(query, embed_model, ollama_url)
        if not query_embedding:
            return []
        results = memories_collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, memories_collection.count())
        )

        memories = []
        documents = results["documents"][0]
        distances = results["distances"][0]
        for doc, distance in zip(documents, distances):
            similarity = 1 - distance
            if similarity >= threshold:
                memories.append(doc)
        return memories
    except Exception as e:
        logger.warning(f"Memory retrieval failed: {e}")
        return []


def delete_memory_record(conn, memories_collection, memory_id: int) -> bool:
    memory = repository.get_memory(conn, memory_id)
    if not memory:
        return False

    deleted = repository.delete_memory(conn, memory_id)
    if deleted and memories_collection is not None:
        try:
            memories_collection.delete(ids=[str(memory_id)])
        except Exception:
            pass
    return deleted


def search_past_chats(conn, query: str, limit: int = 5) -> list[dict]:
    """Search past conversation messages using SQLite full-text search."""
    if not query.strip():
        return []
    cursor = conn.cursor()
    
    # Clean query for FTS5
    clean_query = " ".join(re.findall(r"\w+", query))
    if not clean_query:
        return []
        
    try:
        cursor.execute(
            """
            SELECT c.title, m.role, m.content, m.created_at, m.conversation_id
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.content LIKE ?
            ORDER BY m.id DESC
            LIMIT ?
            """,
            (f"%{clean_query}%", limit),
        )
        rows = cursor.fetchall()
        return [
            {
                "conversation_title": r[0],
                "role": r[1],
                "content": r[2][:300],
                "created_at": r[3],
                "conversation_id": r[4],
            }
            for r in rows
        ]
    except Exception as e:
        logger.warning(f"search_past_chats failed: {e}")
        return []

