import sqlite3
import time
from typing import Any


def record_trajectory_step(
    conn: sqlite3.Connection,
    conversation_id: str,
    message_id: int | None,
    tool_name: str,
    arguments: dict[str, Any],
    result: dict[str, Any],
    duration_ms: float = 0.0,
) -> int:
    """Record a tool execution step in the trajectories table."""
    status = "completed" if result.get("success", True) else "failed"
    error = result.get("error") if status == "failed" else None
    
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO trajectories (conversation_id, message_id, tool_name, arguments_json, result_summary, status, error, duration_ms, created_at)
        VALUES (?, ?, ?, json(?), ?, ?, ?, ?, datetime('now'))
        """,
        (
            conversation_id,
            message_id,
            tool_name,
            str(arguments),
            str(result.get("summary") or result.get("error") or "Executed"),
            status,
            error,
            duration_ms,
        ),
    )
    conn.commit()
    return cursor.lastrowid or 0


def get_conversation_trajectories(
    conn: sqlite3.Connection, conversation_id: str, limit: int = 50
) -> list[dict[str, Any]]:
    """Retrieve trajectory execution history for a conversation."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, message_id, tool_name, arguments_json, result_summary, status, error, duration_ms, created_at
        FROM trajectories
        WHERE conversation_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (conversation_id, limit),
    )
    rows = cursor.fetchall()
    trajectories = []
    for r in rows:
        trajectories.append({
            "id": r[0],
            "message_id": r[1],
            "tool_name": r[2],
            "arguments": r[3],
            "summary": r[4],
            "status": r[5],
            "error": r[6],
            "duration_ms": r[7],
            "created_at": r[8],
        })
    return trajectories
