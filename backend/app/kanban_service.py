import sqlite3
from typing import Any


def create_task(
    conn: sqlite3.Connection,
    title: str,
    description: str = "",
    status: str = "todo",
    priority: str = "medium",
    conversation_id: str | None = None,
) -> dict[str, Any]:
    """Create a new task on the Kanban board."""
    if not title.strip():
        return {"success": False, "error": "Task title cannot be empty."}
        
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO kanban_tasks (title, description, status, priority, conversation_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        (title.strip(), description.strip(), status.lower(), priority.lower(), conversation_id),
    )
    conn.commit()
    task_id = cursor.lastrowid
    return {
        "success": True,
        "task_id": task_id,
        "title": title,
        "status": status,
        "summary": f"Created task #{task_id}: '{title}' [{status}]",
    }


def update_task(
    conn: sqlite3.Connection,
    task_id: int,
    status: str | None = None,
    title: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    """Update status, title, or description of a Kanban task."""
    cursor = conn.cursor()
    fields, params = [], []
    
    if status is not None:
        fields.append("status = ?")
        params.append(status.lower())
    if title is not None:
        fields.append("title = ?")
        params.append(title.strip())
    if description is not None:
        fields.append("description = ?")
        params.append(description.strip())
        
    if not fields:
        return {"success": False, "error": "No fields provided to update."}
        
    fields.append("updated_at = datetime('now')")
    params.append(task_id)
    
    query = f"UPDATE kanban_tasks SET {', '.join(fields)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    
    if cursor.rowcount == 0:
        return {"success": False, "error": f"Task #{task_id} not found."}
        
    return {
        "success": True,
        "task_id": task_id,
        "summary": f"Updated task #{task_id} status to '{status or 'updated'}'",
    }


def list_tasks(conn: sqlite3.Connection, status: str | None = None) -> list[dict[str, Any]]:
    """List all Kanban tasks, optionally filtered by status (todo, in_progress, done)."""
    cursor = conn.cursor()
    if status:
        cursor.execute(
            "SELECT id, title, description, status, priority, created_at FROM kanban_tasks WHERE status = ? ORDER BY id DESC",
            (status.lower(),),
        )
    else:
        cursor.execute(
            "SELECT id, title, description, status, priority, created_at FROM kanban_tasks ORDER BY id DESC"
        )
        
    rows = cursor.fetchall()
    return [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "status": r[3],
            "priority": r[4],
            "created_at": r[5],
        }
        for r in rows
    ]
