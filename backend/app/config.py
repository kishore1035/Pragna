from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ollama_url: str = "http://localhost:11434"

    @field_validator("ollama_url", mode="before")
    @classmethod
    def normalize_ollama_url(cls, v: str | None) -> str:
        if not v or not str(v).strip():
            return "http://localhost:11434"
        val = str(v).strip().rstrip("/")
        if not val.startswith(("http://", "https://")):
            if "localhost" in val or "127.0.0.1" in val:
                return f"http://{val}"
            return f"https://{val}"
        return val
    chat_model: str = "gemma4:cloud"
    embed_model: str = "nomic-embed-text"
    rag_similarity_threshold: float = 0.5
    db_path: str = "data/pragna.db"
    chroma_path: str = "data/chroma_db"
    documents_dir: str = "data/documents"
    jwt_secret: str
    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None

    # Ollama API Key(s) — supports a single key, a comma-separated list,
    # or numbered slots OLLAMA_API_KEY_1 through OLLAMA_API_KEY_9 for load balancing
    ollama_api_key: str | None = None
    ollama_api_keys: str | None = None
    ollama_api_key_1: str | None = None
    ollama_api_key_2: str | None = None
    ollama_api_key_3: str | None = None
    ollama_api_key_4: str | None = None
    ollama_api_key_5: str | None = None
    ollama_api_key_6: str | None = None
    ollama_api_key_7: str | None = None
    ollama_api_key_8: str | None = None
    ollama_api_key_9: str | None = None

    def get_ollama_api_keys(self) -> list[str]:
        """Returns a deduplicated list of all configured Ollama API keys in order."""
        import os
        keys: list[str] = []
        if self.ollama_api_key and self.ollama_api_key.strip():
            keys.append(self.ollama_api_key.strip())
        if self.ollama_api_keys:
            for k in self.ollama_api_keys.replace("\n", ",").split(","):
                k_clean = k.strip()
                if k_clean and k_clean not in keys:
                    keys.append(k_clean)
        for i in range(1, 10):
            val = getattr(self, f"ollama_api_key_{i}", None)
            if val and val.strip() and val.strip() not in keys:
                keys.append(val.strip())
        # Fallback to os.environ for any additional dynamically injected keys
        for i in range(1, 10):
            env_val = os.getenv(f"OLLAMA_API_KEY_{i}")
            if env_val and env_val.strip() and env_val.strip() not in keys:
                keys.append(env_val.strip())
        return keys

    # Public URLs of THIS backend and the frontend. Used to build OAuth
    # callback URLs and to set the right CORS allow-list. Defaults to Render
    # production URLs while still accepting overrides via env vars.
    backend_public_url: str | None = "https://pragna-p7ij.onrender.com"
    frontend_public_url: str | None = "https://frontend-mcce.onrender.com"

    # CORS allow-list. Comma-separated.
    cors_allow_origins: str | None = "https://frontend-mcce.onrender.com,http://localhost:4028,http://localhost:3000,http://localhost:5173,http://localhost:5180"


@lru_cache
def get_settings() -> Settings:
    return Settings()
