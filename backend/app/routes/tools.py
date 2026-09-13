import json
from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app import repository
from app.chat_service import resume_tool_reply
from app.auth import get_current_user

router = APIRouter()


class ResumeToolRequest(BaseModel):
    tool_call_id: int
    approved: bool
    conversation_id: Optional[int] = None


@router.post("/api/conversations/{conversation_id}/resume-tool")
@router.post("/api/tools/resume")
async def resume_tool(
    request: Request,
    body: ResumeToolRequest,
    conversation_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    conn = request.app.state.conn
    cid = conversation_id or body.conversation_id
    if cid is None:
        # Resolve conversation_id from tool_call if not provided directly
        tool_call = repository.get_tool_call(conn, body.tool_call_id)
        if not tool_call:
            raise HTTPException(status_code=404, detail="Tool call not found")
        msg = repository.get_message(conn, tool_call["message_id"])
        cid = msg["conversation_id"] if msg else None

    if cid is None:
        raise HTTPException(status_code=400, detail="conversation_id is required")

    conversation = repository.get_conversation(conn, cid)
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
@router.get("/api/tools/kanban")
async def get_kanban_tasks(request: Request, current_user: dict = Depends(get_current_user)):
    from app import kanban_service
    tasks = kanban_service.list_tasks(request.app.state.conn)
    return {"tasks": tasks}


@router.get("/api/scheduled-tasks")
@router.get("/api/tools/scheduled")
async def get_scheduled_tasks(request: Request, current_user: dict = Depends(get_current_user)):
    from app import cron_service
    jobs = cron_service.list_scheduled_tasks(request.app.state.conn)
    return {"jobs": jobs}


class CreateSkillRequest(BaseModel):
    name: str
    description: str
    instructions: str


@router.get("/api/skills")
@router.get("/api/tools/skills")
async def get_skills(current_user: dict = Depends(get_current_user)):
    from app import skills_service
    skills = skills_service.list_skills()
    return {"skills": skills}


@router.post("/api/skills")
@router.post("/api/tools/skills")
async def create_skill(body: CreateSkillRequest, current_user: dict = Depends(get_current_user)):
    from app import skills_service
    res = skills_service.save_skill(body.name, body.description, body.instructions)
    return res


@router.post("/api/skills/upload")
async def upload_skill(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    from app import skills_service
    import re
    skills_dir = skills_service.ensure_skills_dir()
    clean_filename = re.sub(r"[^\w\.\-]", "_", file.filename)
    if not clean_filename.endswith((".md", ".py")):
        clean_filename += ".md"
    content = await file.read()
    dest = skills_dir / clean_filename
    dest.write_bytes(content)
    skills = skills_service.list_skills()
    return {"success": True, "message": f"Skill file '{clean_filename}' uploaded successfully.", "skills": skills}


@router.post("/api/skills/reload")
async def reload_skills(current_user: dict = Depends(get_current_user)):
    from app import skills_service
    skills = skills_service.list_skills()
    return {"success": True, "message": f"Skills reloaded. {len(skills)} skills active.", "skills": skills}


@router.delete("/api/skills/{name}")
@router.delete("/api/tools/skills/{name}")
async def delete_skill(name: str, current_user: dict = Depends(get_current_user)):
    from app import skills_service
    clean_name = name.replace(".md", "").strip()
    path = skills_service.SKILLS_DIR / f"{clean_name}.md"
    if path.exists():
        path.unlink()
        return {"success": True, "message": f"Deleted skill '{clean_name}'"}
    raise HTTPException(status_code=404, detail="Skill not found")
