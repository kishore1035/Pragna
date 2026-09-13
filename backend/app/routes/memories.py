from fastapi import APIRouter, Request, HTTPException, Depends
from app import repository
from app.memory_service import delete_memory_record
from app.auth import get_current_user

router = APIRouter()


@router.get("/api/memories")
async def list_memories(request: Request, current_user: dict = Depends(get_current_user)):
    return repository.list_memories(request.app.state.conn)


@router.delete("/api/memories/{memory_id}")
async def delete_memory(request: Request, memory_id: int, current_user: dict = Depends(get_current_user)):
    conn = request.app.state.conn
    memories_collection = getattr(request.app.state, "memories_collection", None)
    deleted = delete_memory_record(conn, memories_collection, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"id": memory_id, "deleted": True}
