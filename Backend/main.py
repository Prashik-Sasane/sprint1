from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

load_dotenv()

from train_brain import auto_assigner, sprint_report, use_ai  # noqa: E402
from train_brain.runtime import (  # noqa: E402
    db_available,
    fetch_backlog,
    fetch_history,
    fetch_team_members,
    create_team_member,
    update_team_member,
    delete_team_member,
    fetch_sprints,
    create_sprint as rt_create_sprint,
    update_sprint as rt_update_sprint,
    delete_sprint as rt_delete_sprint,
    duplicate_sprint as rt_duplicate_sprint,
    fetch_tasks_with_status,
    create_task as rt_create_task,
    update_task as rt_update_task,
    delete_task as rt_delete_task,
    update_task_status as rt_update_task_status,
    fetch_activity,
    get_velocity_data,
    KANBAN_COLUMNS,
)


# ── Pydantic Models ──

class TeamMember(BaseModel):
    dev_id: Optional[int] = None
    name: str
    experience_level: Literal["Junior", "Mid", "Senior"] = "Mid"
    primary_skill: str = "Backend"
    secondary_skill: Optional[str] = None
    current_load: float = 0
    max_capacity: float = 40
    availability_pct: float = 100
    focus_factor: float = 1.0


class SprintTask(BaseModel):
    task_id: int
    title: str
    description: str = ""
    story_points: int = Field(ge=1, default=1)
    priority: Literal["Low", "Medium", "High", "Critical"] = "Medium"
    skill_tag: str = "Backend"
    task_type: Literal["Feature", "Bug", "Chore", "Spike"] = "Feature"
    dependencies: List[int] = Field(default_factory=list)
    due_in_days: int = Field(ge=1, default=10)
    assignee_hint: str = ""
    confidence: int = Field(ge=0, le=100, default=70)
    must_do: bool = False


class SprintContext(BaseModel):
    sprint_name: str = "Upcoming Sprint"
    current_team_load: float = 35
    deadline_limit: float = 40
    meeting_hours: float = 4
    support_hours: float = 2
    risk_tolerance: Literal["Low", "Balanced", "Aggressive"] = "Balanced"


class PredictionRequest(BaseModel):
    tasks: List[SprintTask]
    sprint: SprintContext
    team_members: List[TeamMember] = Field(default_factory=list)


class SprintCreate(BaseModel):
    sprint_name: str = "New Sprint"
    start_date: str = ""
    end_date: str = ""
    goal: str = ""
    current_team_load: float = 40
    deadline_limit: float = 40
    meeting_hours: float = 4
    support_hours: float = 2
    risk_tolerance: Literal["Low", "Balanced", "Aggressive"] = "Balanced"


class TaskStatusUpdate(BaseModel):
    status: str


class TaskCreate(BaseModel):
    sprint_id: int = 1
    title: str
    description: str = ""
    story_points: int = Field(ge=1, default=1)
    priority: Literal["Low", "Medium", "High", "Critical"] = "Medium"
    status: Literal["Backlog", "To Do", "In Progress", "Review", "Done"] = "Backlog"
    skill_tag: str = "Backend"
    task_type: Literal["Feature", "Bug", "Chore", "Spike"] = "Feature"
    dependencies: List[int] = Field(default_factory=list)
    due_in_days: int = Field(ge=1, default=10)
    assignee_hint: str = ""
    confidence: int = Field(ge=0, le=100, default=70)
    must_do: bool = False
    assigned_to: str = ""
    predicted_hours: float = 0
    risk_score: float = 0


# ── App Setup ──

app = FastAPI(title="OptiSprint Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──

@app.get("/")
async def health_check():
    return {"status": "online", "product": "OptiSprint Planner", "docs": "/docs"}


@app.get("/api/health")
async def api_health():
    return {
        "status": "online",
        "api": "connected",
        "database": "connected" if db_available() else "fallback",
        "models": "loaded",
    }


# ── Reference Data ──

@app.get("/api/reference-data")
async def reference_data():
    return {
        "status": "success",
        "team_members": fetch_team_members(),
        "backlog": fetch_backlog(),
        "history": fetch_history(),
    }


# ── Sprint Planning ──

@app.post("/api/predict-sprint")
async def predict(data: PredictionRequest):
    try:
        payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
        result = use_ai.process_sprint(payload)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get("message", "Planning failed."))
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/auto-assign")
async def auto_assign(data: Optional[PredictionRequest] = None):
    try:
        payload = (
            data.model_dump() if data and hasattr(data, "model_dump")
            else data.dict() if data
            else None
        )
        result = auto_assigner.run_auto_assignment(payload)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get("message", "Assignment failed."))
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/sprint-report")
async def get_report():
    try:
        return sprint_report.generate_sprint_analytics()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Team Members CRUD ──

@app.get("/api/team-members")
async def list_team_members():
    return {"status": "success", "team_members": fetch_team_members()}


@app.post("/api/team-members")
async def add_team_member(member: TeamMember):
    payload = member.model_dump() if hasattr(member, "model_dump") else member.dict()
    result = create_team_member(payload)
    return {"status": "success", "member": result}


@app.put("/api/team-members/{dev_id}")
async def edit_team_member(dev_id: int, member: TeamMember):
    payload = member.model_dump() if hasattr(member, "model_dump") else member.dict()
    result = update_team_member(dev_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="Team member not found.")
    return {"status": "success", "member": result}


@app.delete("/api/team-members/{dev_id}")
async def remove_team_member(dev_id: int):
    success = delete_team_member(dev_id)
    if not success:
        raise HTTPException(status_code=404, detail="Team member not found.")
    return {"status": "success"}


# ── Sprints CRUD ──

@app.get("/api/sprints")
async def list_sprints():
    return {"status": "success", "sprints": fetch_sprints()}


@app.post("/api/sprints")
async def create_sprint_endpoint(sprint: SprintCreate):
    payload = sprint.model_dump() if hasattr(sprint, "model_dump") else sprint.dict()
    result = rt_create_sprint(payload)
    return {"status": "success", "sprint": result}


@app.put("/api/sprints/{sprint_id}")
async def edit_sprint(sprint_id: int, sprint: SprintCreate):
    payload = sprint.model_dump() if hasattr(sprint, "model_dump") else sprint.dict()
    result = rt_update_sprint(sprint_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="Sprint not found.")
    return {"status": "success", "sprint": result}


@app.delete("/api/sprints/{sprint_id}")
async def remove_sprint(sprint_id: int):
    success = rt_delete_sprint(sprint_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sprint not found.")
    return {"status": "success"}


@app.post("/api/sprints/{sprint_id}/duplicate")
async def clone_sprint(sprint_id: int):
    result = rt_duplicate_sprint(sprint_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Sprint not found.")
    return {"status": "success", "sprint": result}


# ── Tasks ──

@app.get("/api/tasks")
async def list_tasks(status: Optional[str] = None, assignee: Optional[str] = None):
    tasks = fetch_tasks_with_status()
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if assignee:
        tasks = [t for t in tasks if t.get("assignee_hint", "").lower() == assignee.lower()]
    return {"status": "success", "tasks": tasks}


@app.post("/api/tasks")
async def add_task(task: TaskCreate):
    payload = task.model_dump() if hasattr(task, "model_dump") else task.dict()
    result = rt_create_task(payload)
    return {"status": "success", "task": result}


@app.put("/api/tasks/{task_id}")
async def edit_task(task_id: int, task: TaskCreate):
    payload = task.model_dump() if hasattr(task, "model_dump") else task.dict()
    result = rt_update_task(task_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "success", "task": result}


@app.delete("/api/tasks/{task_id}")
async def remove_task(task_id: int):
    success = rt_delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "success"}


@app.patch("/api/tasks/{task_id}/status")
async def change_task_status(task_id: int, update: TaskStatusUpdate):
    if update.status not in KANBAN_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(KANBAN_COLUMNS)}",
        )
    result = rt_update_task_status(task_id, update.status)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "success", "task": result}


# ── Activity Log ──

@app.get("/api/activity")
async def get_activity():
    return {"status": "success", "activity": fetch_activity()}


# ── Velocity / Burndown ──

@app.get("/api/sprints/{sprint_id}/velocity")
async def sprint_velocity(sprint_id: int):
    data = get_velocity_data(sprint_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Sprint not found.")
    return {"status": "success", **data}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
