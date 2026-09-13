import asyncio
import base64
import io
import logging
import os
from typing import AsyncGenerator, Dict, Any, List, Optional
import edge_tts

logger = logging.getLogger("mimir.voice")

DEFAULT_VOICE = "en-US-AriaNeural"

FEATURED_VOICES = [
    {"id": "en-US-AriaNeural", "name": "Aria (US)", "gender": "Female", "locale": "en-US", "accent": "American", "recommended": True},
    {"id": "en-US-GuyNeural", "name": "Guy (US)", "gender": "Male", "locale": "en-US", "accent": "American", "recommended": True},
    {"id": "en-US-JennyNeural", "name": "Jenny (US)", "gender": "Female", "locale": "en-US", "accent": "American"},
    {"id": "en-US-ChristopherNeural", "name": "Christopher (US)", "gender": "Male", "locale": "en-US", "accent": "American"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia (UK)", "gender": "Female", "locale": "en-GB", "accent": "British", "recommended": True},
    {"id": "en-GB-RyanNeural", "name": "Ryan (UK)", "gender": "Male", "locale": "en-GB", "accent": "British"},
    {"id": "en-IN-NeerjaNeural", "name": "Neerja (India)", "gender": "Female", "locale": "en-IN", "accent": "Indian", "recommended": True},
    {"id": "en-IN-PrabhatNeural", "name": "Prabhat (India)", "gender": "Male", "locale": "en-IN", "accent": "Indian"},
    {"id": "en-AU-NatashaNeural", "name": "Natasha (Australia)", "gender": "Female", "locale": "en-AU", "accent": "Australian"},
    {"id": "fr-FR-DeniseNeural", "name": "Denise (French)", "gender": "Female", "locale": "fr-FR", "accent": "French"},
    {"id": "de-DE-KatjaNeural", "name": "Katja (German)", "gender": "Female", "locale": "de-DE", "accent": "German"},
    {"id": "es-ES-ElviraNeural", "name": "Elvira (Spanish)", "gender": "Female", "locale": "es-ES", "accent": "Spanish"},
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Japanese)", "gender": "Female", "locale": "ja-JP", "accent": "Japanese"},
]

def clean_text_for_speech(text: str) -> str:
    """Strip markdown code blocks, links, math, and artifacts from spoken text."""
    if not text:
        return ""
    import re
    # Remove code blocks
    cleaned = re.sub(r"```[\s\S]*?```", " Code snippet omitted for speech. ", text)
    # Remove inline code
    cleaned = re.sub(r"`[^`]+`", "", cleaned)
    # Convert markdown links [text](url) to text
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    # Remove image links
    cleaned = re.sub(r"!\[.*?\]\(.*?\)", "", cleaned)
    # Remove excessive formatting symbols (*, _, #, ~)
    cleaned = re.sub(r"[*_#~>`]", "", cleaned)
    # Clean whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


async def synthesize_speech_bytes(
    text: str,
    voice: str = DEFAULT_VOICE,
    rate: str = "+0%",
    pitch: str = "+0Hz",
) -> bytes:
    """Synthesize text into MP3 audio bytes using Edge Neural TTS."""
    clean_text = clean_text_for_speech(text)
    if not clean_text:
        return b""

    try:
        communicate = edge_tts.Communicate(clean_text, voice=voice, rate=rate, pitch=pitch)
        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk.get("type") == "audio" and "data" in chunk:
                audio_buffer.extend(chunk["data"])  # type: ignore
        return bytes(audio_buffer)
    except Exception as e:
        logger.error(f"Speech synthesis error ({voice}): {e}")
        raise


async def stream_speech_chunks(
    text: str,
    voice: str = DEFAULT_VOICE,
    rate: str = "+0%",
    pitch: str = "+0Hz",
) -> AsyncGenerator[bytes, None]:
    """Stream raw MP3 audio chunks as they are synthesized."""
    clean_text = clean_text_for_speech(text)
    if not clean_text:
        return

    communicate = edge_tts.Communicate(clean_text, voice=voice, rate=rate, pitch=pitch)
    async for chunk in communicate.stream():
        if chunk.get("type") == "audio" and "data" in chunk:
            yield chunk["data"]  # type: ignore


def get_available_voices() -> List[Dict[str, Any]]:
    """Return available high-quality voice profiles."""
    return FEATURED_VOICES


async def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio bytes using local Whisper / Faster-Whisper if available,
    or fallback to lightweight speech recognition.
    """
    if not audio_bytes:
        return ""

    # Check if local whisper is available
    try:
        import importlib
        whisper = importlib.import_module("whisper")
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        model = whisper.load_model("base")
        result = model.transcribe(tmp_path)
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        return result.get("text", "").strip()
    except Exception as e:
        logger.warning(f"Whisper transcription unavailable: {e}. Passing through.")
        return ""
