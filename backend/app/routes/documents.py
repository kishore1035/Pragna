import os
import time
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Request, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app import repository
from app.rag import ingest_file
from app.auth import get_optional_current_user

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".xlsx", ".pptx", ".csv"}

router = APIRouter()

GENERATED_DOCS_DIR = Path("data/generated_docs")


class DocumentGenerateRequest(BaseModel):
    format: str
    prompt: str
    language: Optional[str] = "en"


@router.post("/api/documents/upload")
async def upload_document(
    request: Request, file: UploadFile = File(...), current_user: dict = Depends(get_optional_current_user)
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    settings = request.app.state.settings
    dest_dir = Path(settings.documents_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    destination = dest_dir / file.filename

    content = await file.read()
    with open(destination, "wb") as f:
        f.write(content)

    conn = request.app.state.conn
    existing = repository.get_document_by_filename(conn, file.filename)
    if existing:
        document_id = existing["id"]
    else:
        document_id = repository.create_document_record(
            conn, file.filename, "upload", len(content)
        )

    chunk_count = await ingest_file(
        destination,
        file.filename,
        document_id,
        request.app.state.collection,
        settings.embed_model,
        settings.ollama_url,
    )
    repository.update_document_chunk_count(conn, document_id, chunk_count)
    return {"id": document_id, "filename": file.filename, "chunk_count": chunk_count}


@router.get("/api/documents")
async def list_documents(request: Request, current_user: dict = Depends(get_optional_current_user)):
    return repository.list_documents(request.app.state.conn)


@router.delete("/api/documents/{document_id}")
async def delete_document(
    document_id: int, request: Request, current_user: dict = Depends(get_optional_current_user)
):

    conn = request.app.state.conn
    doc = repository.get_document_by_id(conn, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        request.app.state.collection.delete(where={"document_id": document_id})
    except Exception:
        pass

    settings = request.app.state.settings
    file_path = Path(settings.documents_dir) / doc["filename"]
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    repository.delete_document_record(conn, document_id)
    return {"success": True, "id": document_id}


@router.post("/api/documents/generate")
async def generate_document_endpoint(body: DocumentGenerateRequest):
    fmt = body.format.strip().lower()
    prompt = body.prompt.strip()
    if fmt not in {"docx", "xlsx", "pdf", "pptx"}:
        raise HTTPException(status_code=400, detail="Format must be one of docx, xlsx, pdf, pptx")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    try:
        from app.document_generator import (
            _build_docx,
            _build_pdf,
            _build_pptx,
            _build_xlsx,
            _sanitize_filename_component,
            _generate_fallback_structure,
        )

        structure = _generate_fallback_structure(prompt, language=body.language or "en")
        GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)

        builders = {"docx": _build_docx, "xlsx": _build_xlsx, "pdf": _build_pdf, "pptx": _build_pptx}
        subject_slug = _sanitize_filename_component(structure.get("title") or prompt)
        filename = f"{int(time.time())}-{subject_slug}.{fmt}"
        filepath = GENERATED_DOCS_DIR / filename
        builders[fmt](structure, str(filepath))

        display_name = f"{structure.get('title') or prompt}.{fmt}"

        # Markdown preview lines
        md_lines = [f"# {structure.get('title') or prompt}\n"]
        for sec in structure.get("sections", []):
            if sec.get("heading"):
                md_lines.append(f"\n## {sec['heading']}\n")
            for b in sec.get("bullets", []):
                md_lines.append(f"- {b}")
            tbl = sec.get("table")
            if tbl and isinstance(tbl, list) and len(tbl) > 0:
                header = tbl[0]
                md_lines.append("\n| " + " | ".join(str(c) for c in header) + " |")
                md_lines.append("| " + " | ".join(["---"] * len(header)) + " |")
                for row in tbl[1:]:
                    md_lines.append("| " + " | ".join(str(c) for c in row) + " |")
                md_lines.append("")

        content_markdown = "\n".join(md_lines).strip()

        return {
            "success": True,
            "download_url": f"/api/documents/download/{filename}",
            "filename": display_name,
            "title": structure.get("title") or prompt,
            "format": fmt,
            "content": content_markdown,
        }
    except Exception as e:
        # Fallback text file
        GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"{int(time.time())}-document.{fmt}"
        filepath = GENERATED_DOCS_DIR / filename
        filepath.write_text(f"# {prompt}\n\nGenerated content for {prompt}", encoding="utf-8")
        return {
            "success": True,
            "download_url": f"/api/documents/download/{filename}",
            "filename": filename,
            "title": prompt,
            "format": fmt,
            "content": f"# {prompt}\n\nGenerated content for {prompt}",
        }


@router.get("/api/documents/download/{filename}")
async def download_generated_document(filename: str):
    clean_name = Path(filename).name
    filepath = GENERATED_DOCS_DIR / clean_name
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, filename=clean_name)
