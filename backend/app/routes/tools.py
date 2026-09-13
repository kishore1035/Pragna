import json
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app import repository
from app.chat_service import resume_tool_reply
from app.auth import get_optional_current_user, get_current_user

router = APIRouter()


class ResumeToolRequest(BaseModel):
    tool_call_id: int
    approved: bool


@router.post("/api/conversations/{conversation_id}/resume-tool")
async def resume_tool(
    request: Request, conversation_id: int, body: ResumeToolRequest, current_user: dict = Depends(get_optional_current_user)
):
    conn = request.app.state.conn
    conversation = repository.get_conversation(conn, conversation_id)
    if not conversation or conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Conversation not found")

    tool_call = repository.get_tool_call(conn, body.tool_call_id)

    if not tool_call:
        raise HTTPException(status_code=409, detail="Tool call not found")

    if tool_call["status"] != "pending":
        raise HTTPException(status_code=409, detail="Tool call is not pending approval")

    state = request.app.state
    memories_collection = getattr(state, "memories_collection", None)
    browser_service = getattr(state, "browser_service", None)

    async def event_stream():
        async for event in resume_tool_reply(
            state.conn, state.collection, body.tool_call_id, body.approved, state.settings,
            user_id=current_user["id"],
            memories_collection=memories_collection,
            browser_service=browser_service,
        ):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/api/kanban")
async def get_kanban_tasks(request: Request, current_user: dict = Depends(get_optional_current_user)):
    from app import kanban_service
    tasks = kanban_service.list_tasks(request.app.state.conn)
    return {"tasks": tasks}


@router.get("/api/scheduled-tasks")
async def get_scheduled_tasks(request: Request, current_user: dict = Depends(get_optional_current_user)):
    from app import cron_service
    jobs = cron_service.list_scheduled_tasks(request.app.state.conn)
    return {"jobs": jobs}


class CreateSkillRequest(BaseModel):
    name: str
    description: str
    instructions: str


@router.get("/api/skills")
async def get_skills(current_user: dict = Depends(get_optional_current_user)):
    from app import skills_service
    skills = skills_service.list_skills()
    return {"skills": skills}


@router.post("/api/skills")
async def create_skill(body: CreateSkillRequest, current_user: dict = Depends(get_current_user)):
    from app import skills_service
    res = skills_service.save_skill(body.name, body.description, body.instructions)
    return res


@router.delete("/api/skills/{name}")
async def delete_skill(name: str, current_user: dict = Depends(get_current_user)):
    from app import skills_service
    clean_name = name.replace(".md", "").strip()
    path = skills_service.SKILLS_DIR / f"{clean_name}.md"
    if path.exists():
        path.unlink()
        return {"success": True, "message": f"Deleted skill '{clean_name}'"}
    raise HTTPException(status_code=404, detail="Skill not found")
