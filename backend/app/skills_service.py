import os
import re
from pathlib import Path
from typing import Any

SKILLS_DIR = Path("data/skills")


def ensure_skills_dir() -> Path:
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    return SKILLS_DIR


def _parse_skill_file(file_path: Path) -> dict[str, Any] | None:
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None

    # Determine skill name
    if file_path.name.lower() == "skill.md":
        name = file_path.parent.name
        cat = file_path.parent.parent.name if file_path.parent.parent != SKILLS_DIR else ""
    else:
        name = file_path.stem
        cat = file_path.parent.name if file_path.parent != SKILLS_DIR else ""

    description = "No description provided."

    # Parse YAML frontmatter
    if content.startswith("---"):
        fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
        if fm_match:
            fm = fm_match.group(1)
            name_match = re.search(r"name:\s*([^\n]+)", fm, re.IGNORECASE)
            if name_match:
                name = name_match.group(1).strip().strip('"\'')
            desc_match = re.search(r"description:\s*([^\n]+)", fm, re.IGNORECASE)
            if desc_match:
                description = desc_match.group(1).strip().strip('"\'')
    else:
        first_lines = [line.strip() for line in content.splitlines() if line.strip() and not line.startswith("#")]
        if first_lines:
            description = first_lines[0][:150]

    relative_path = str(file_path.relative_to(SKILLS_DIR)).replace("\\", "/")

    return {
        "name": name,
        "category": cat or "general",
        "path": relative_path,
        "filename": file_path.name,
        "description": description,
        "size_bytes": file_path.stat().st_size,
    }


def list_skills() -> list[dict[str, Any]]:
    """List all available agent skills in data/skills directory recursively."""
    skills_dir = ensure_skills_dir()
    skills = []
    seen_names = set()

    for file_path in sorted(skills_dir.rglob("*.md")):
        if file_path.name.upper() in ("README.MD", "DESCRIPTION.MD", "CONTRIBUTING.MD"):
            continue
        info = _parse_skill_file(file_path)
        if info and info["name"] not in seen_names:
            seen_names.add(info["name"])
            skills.append(info)

    return skills


def read_skill(skill_name: str) -> dict[str, Any]:
    """Read the complete content of a skill document by name or path."""
    skills_dir = ensure_skills_dir()
    clean_name = skill_name.replace(".md", "").strip().lower()

    # Search by exact path, stem name, or folder name
    target_file: Path | None = None
    for file_path in skills_dir.rglob("*.md"):
        if file_path.name.upper() in ("README.MD", "DESCRIPTION.MD"):
            continue
        rel = str(file_path.relative_to(SKILLS_DIR)).replace("\\", "/").lower()
        if clean_name in (file_path.stem.lower(), file_path.parent.name.lower(), rel, rel.replace(".md", "")):
            target_file = file_path
            break

    if not target_file or not target_file.exists():
        return {
            "success": False,
            "error": f"Skill '{skill_name}' not found.",
        }

    content = target_file.read_text(encoding="utf-8", errors="ignore")
    return {
        "success": True,
        "name": skill_name,
        "path": str(target_file.relative_to(SKILLS_DIR)),
        "content": content,
    }


def save_skill(name: str, description: str, instructions: str) -> dict[str, Any]:
    """Save or update an agent skill markdown file."""
    skills_dir = ensure_skills_dir()
    clean_name = re.sub(r"[^\w\-]", "_", name.strip().lower())
    file_path = skills_dir / f"{clean_name}.md"

    formatted_content = f"""---
name: {name}
description: {description}
---

# {name}

{instructions.strip()}
"""
    file_path.write_text(formatted_content, encoding="utf-8")
    return {
        "success": True,
        "name": clean_name,
        "filename": file_path.name,
        "message": f"Skill '{clean_name}' saved successfully.",
    }
