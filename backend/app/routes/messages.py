from typing import Literal
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from app import repository
from app.auth import get_current_user

router = APIRouter()


class FeedbackRequest(BaseModel):
    rating: Literal["up", "down"]


@router.post("/api/messages/{message_id}/feedback")
async def set_feedback(
    request: Request, message_id: int, body: FeedbackRequest, current_user: dict = Depends(get_current_user)
):
    conn = request.app.state.conn
    message = repository.get_message(conn, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    conversation = repository.get_conversation(conn, message["conversation_id"])
    if not conversation or conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Message not found")
    repository.set_feedback(conn, message_id, body.rating)
    return {"id": message_id, "feedback": body.rating}
