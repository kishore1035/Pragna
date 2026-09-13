from fastapi import APIRouter, Request, HTTPException, Depends
from app import repository
from app.auth import get_current_user

router = APIRouter()


@router.get("/api/artifacts/{artifact_id}")
async def get_artifact(request: Request, artifact_id: int, current_user: dict = Depends(get_current_user)):
    conn = request.app.state.conn
    artifact = repository.get_artifact(conn, artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    message = repository.get_message(conn, artifact["message_id"])
    conversation = repository.get_conversation(conn, message["conversation_id"]) if message else None
    if not conversation or conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact
