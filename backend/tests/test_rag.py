from pathlib import Path
from unittest.mock import AsyncMock, patch
import chromadb
from app.rag import chunk_text, extract_text, ingest_file, retrieve


def test_chunk_text_splits_with_overlap():
    text = "a" * 1500
    chunks = chunk_text(text, chunk_size=700, overlap=100)
    assert len(chunks) == 3
    assert chunks[0] == "a" * 700
    # second chunk starts 100 chars before the end of the first
    assert chunks[1][:100] == chunks[0][-100:]


def test_chunk_text_empty_string_returns_no_chunks():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_extract_text_reads_txt_file(tmp_path):
    file_path = tmp_path / "note.txt"
    file_path.write_text("hello world", encoding="utf-8")
    assert extract_text(file_path) == "hello world"


FAKE_EMBEDDING = [0.1, 0.2, 0.3]


async def _fake_embed(text, model, ollama_url):
    return FAKE_EMBEDDING


async def test_ingest_file_adds_chunks_to_collection(tmp_path):
    client = chromadb.PersistentClient(path=str(tmp_path / "chroma"))
    collection = client.get_or_create_collection(
        name="documents", metadata={"hnsw:space": "cosine"}
    )
    sample_path = Path(__file__).parent / "fixtures" / "sample.txt"

    with patch("app.rag.embed", new=AsyncMock(side_effect=_fake_embed)):
        chunk_count = await ingest_file(
            sample_path, "sample.txt", document_id=1,
            collection=collection, embed_model="test-embed", ollama_url="http://fake",
        )

    assert chunk_count >= 1
    assert collection.count() == chunk_count


async def test_retrieve_filters_by_threshold(tmp_path):
    client = chromadb.PersistentClient(path=str(tmp_path / "chroma"))
    collection = client.get_or_create_collection(
        name="documents", metadata={"hnsw:space": "cosine"}
    )
    collection.add(
        ids=["1"],
        embeddings=[[1.0, 0.0, 0.0]],
        documents=["exact match content"],
        metadatas=[{"document_id": 1, "filename": "sample.txt"}],
    )

    async def fake_embed_exact(text, model, ollama_url):
        return [1.0, 0.0, 0.0]

    with patch("app.rag.embed", new=AsyncMock(side_effect=fake_embed_exact)):
        results = await retrieve(
            "query", collection, "test-embed", "http://fake", top_k=4, threshold=0.5
        )

    assert len(results) == 1
    assert results[0]["filename"] == "sample.txt"
    assert results[0]["similarity"] > 0.99


async def test_retrieve_returns_empty_when_collection_empty(tmp_path):
    client = chromadb.PersistentClient(path=str(tmp_path / "chroma"))
    collection = client.get_or_create_collection(
        name="documents", metadata={"hnsw:space": "cosine"}
    )

    with patch("app.rag.embed", new=AsyncMock(side_effect=_fake_embed)):
        results = await retrieve(
            "query", collection, "test-embed", "http://fake", top_k=4, threshold=0.5
        )

    assert results == []
