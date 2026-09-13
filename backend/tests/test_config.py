from app.config import Settings


def test_settings_defaults(monkeypatch):
    monkeypatch.delenv("OLLAMA_URL", raising=False)
    monkeypatch.delenv("CHAT_MODEL", raising=False)
    monkeypatch.delenv("EMBED_MODEL", raising=False)
    settings = Settings(jwt_secret="test_jwt_secret", _env_file=None)
    assert settings.ollama_url == "http://localhost:11434"
    assert settings.chat_model == "gemma4:cloud"
    assert settings.embed_model == "nomic-embed-text"
    assert settings.rag_similarity_threshold == 0.5
    assert settings.db_path == "data/pragna.db"


def test_settings_override(monkeypatch):
    monkeypatch.setenv("CHAT_MODEL", "llama3.1")
    settings = Settings(jwt_secret="test_jwt_secret", _env_file=None)
    assert settings.chat_model == "llama3.1"
