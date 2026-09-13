import re
from app import repository


# Matches fenced blocks starting with ```artifact ...
# e.g.:
# ```artifact title="Add Two Numbers" language="python"
# def add(a, b):
#     return a + b
# ```
ARTIFACT_BLOCK_REGEX = re.compile(
    r"```artifact(?:\s+([^\n]*))?\n([\s\S]*?)\n```",
    re.MULTILINE
)

# Matches title="..." and language="..." inside the info string
TITLE_REGEX = re.compile(r'title=["\']([^"\']+)["\']')
LANG_REGEX = re.compile(r'language=["\']([^"\']+)["\']')


def extract_and_save_artifacts(conn, message_id: int, content: str) -> list[int]:
    if not content or "```artifact" not in content:
        return []

    created_ids = []
    for match in ARTIFACT_BLOCK_REGEX.finditer(content):
        info_str = match.group(1) or ""
        block_content = match.group(2)

        title_match = TITLE_REGEX.search(info_str)
        title = title_match.group(1).strip() if title_match else "Untitled"

        lang_match = LANG_REGEX.search(info_str)
        language = lang_match.group(1).strip() if lang_match else None

        artifact_id = repository.create_artifact(
            conn, message_id=message_id, title=title, language=language, content=block_content
        )
        created_ids.append(artifact_id)

    return created_ids
