from __future__ import annotations

import json
import os
import urllib.parse
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = urllib.parse.quote_plus(os.getenv("DB_PASSWORD", ""))
DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "smart_planner")


DEFAULT_TEAM = [
    {
        "dev_id": 1,
        "name": "Ava",
        "experience_level": "Senior",
        "primary_skill": "Backend",
        "secondary_skill": "Database",
        "current_load": 10.0,
        "max_capacity": 40.0,
        "availability_pct": 90.0,
        "focus_factor": 1.15,
    },
    {
        "dev_id": 2,
        "name": "Noah",
        "experience_level": "Senior",
        "primary_skill": "Frontend",
        "secondary_skill": "UI/UX",
        "current_load": 12.0,
        "max_capacity": 40.0,
        "availability_pct": 85.0,
        "focus_factor": 1.05,
    },
    {
        "dev_id": 3,
        "name": "Mia",
        "experience_level": "Mid",
        "primary_skill": "API",
        "secondary_skill": "Backend",
        "current_load": 8.0,
        "max_capacity": 40.0,
        "availability_pct": 100.0,
        "focus_factor": 1.0,
    },
    {
        "dev_id": 4,
        "name": "Leo",
        "experience_level": "Mid",
        "primary_skill": "DevOps",
        "secondary_skill": "Security",
        "current_load": 6.0,
        "max_capacity": 40.0,
        "availability_pct": 95.0,
        "focus_factor": 0.95,
    },
    {
        "dev_id": 5,
        "name": "Ivy",
        "experience_level": "Junior",
        "primary_skill": "Frontend",
        "secondary_skill": "Mobile",
        "current_load": 4.0,
        "max_capacity": 35.0,
        "availability_pct": 100.0,
        "focus_factor": 0.9,
    },
    {
        "dev_id": 6,
        "name": "Ethan",
        "experience_level": "Junior",
        "primary_skill": "Backend",
        "secondary_skill": "API",
        "current_load": 5.0,
        "max_capacity": 35.0,
        "availability_pct": 100.0,
        "focus_factor": 0.88,
    },
]

DEFAULT_TASKS = [
    {
        "task_id": 1,
        "title": "Checkout API hardening",
        "description": "Stabilize payment retries and webhook reconciliation.",
        "story_points": 5,
        "priority": "High",
        "skill_tag": "Backend",
        "task_type": "Bug",
        "dependencies": [],
        "due_in_days": 4,
        "assignee_hint": "Ava",
        "confidence": 55,
        "must_do": True,
        "status": "To Do",
    },
    {
        "task_id": 2,
        "title": "Dashboard redesign",
        "description": "Refresh sprint summary, metrics, and risk callouts.",
        "story_points": 8,
        "priority": "Medium",
        "skill_tag": "Frontend",
        "task_type": "Feature",
        "dependencies": [1],
        "due_in_days": 8,
        "assignee_hint": "Noah",
        "confidence": 70,
        "must_do": True,
        "status": "In Progress",
    },
    {
        "task_id": 3,
        "title": "CI pipeline cleanup",
        "description": "Reduce flaky deploy steps and improve artifact retention.",
        "story_points": 3,
        "priority": "Medium",
        "skill_tag": "DevOps",
        "task_type": "Chore",
        "dependencies": [],
        "due_in_days": 10,
        "assignee_hint": "",
        "confidence": 78,
        "must_do": False,
        "status": "Backlog",
    },
    {
        "task_id": 4,
        "title": "User auth flow redesign",
        "description": "Implement OAuth2 login with Google and GitHub providers.",
        "story_points": 8,
        "priority": "High",
        "skill_tag": "Backend",
        "task_type": "Feature",
        "dependencies": [],
        "due_in_days": 6,
        "assignee_hint": "Ava",
        "confidence": 60,
        "must_do": True,
        "status": "To Do",
    },
    {
        "task_id": 5,
        "title": "Mobile responsive fixes",
        "description": "Fix layout overflow issues on tablet and mobile viewports.",
        "story_points": 3,
        "priority": "Low",
        "skill_tag": "Frontend",
        "task_type": "Bug",
        "dependencies": [2],
        "due_in_days": 12,
        "assignee_hint": "Ivy",
        "confidence": 85,
        "must_do": False,
        "status": "Backlog",
    },
    {
        "task_id": 6,
        "title": "API rate limiting",
        "description": "Add rate limiting middleware to protect critical endpoints.",
        "story_points": 5,
        "priority": "Medium",
        "skill_tag": "API",
        "task_type": "Feature",
        "dependencies": [4],
        "due_in_days": 9,
        "assignee_hint": "Mia",
        "confidence": 72,
        "must_do": False,
        "status": "To Do",
    },
    {
        "task_id": 7,
        "title": "Database index optimization",
        "description": "Profile slow queries and add missing indexes for sprint tables.",
        "story_points": 3,
        "priority": "Medium",
        "skill_tag": "Database",
        "task_type": "Chore",
        "dependencies": [],
        "due_in_days": 14,
        "assignee_hint": "",
        "confidence": 80,
        "must_do": False,
        "status": "Backlog",
    },
    {
        "task_id": 8,
        "title": "Security audit remediation",
        "description": "Address findings from the latest penetration test report.",
        "story_points": 13,
        "priority": "Critical",
        "skill_tag": "Security",
        "task_type": "Bug",
        "dependencies": [4, 6],
        "due_in_days": 5,
        "assignee_hint": "Leo",
        "confidence": 40,
        "must_do": True,
        "status": "To Do",
    },
]

DEFAULT_SPRINTS = [
    {
        "sprint_id": 1,
        "sprint_name": "Sprint 24 — Foundation",
        "status": "active",
        "start_date": "2026-04-28",
        "end_date": "2026-05-09",
        "goal": "Deliver core auth flow and stabilize checkout API.",
        "current_team_load": 42,
        "deadline_limit": 40,
        "meeting_hours": 5,
        "support_hours": 3,
        "risk_tolerance": "Balanced",
    },
    {
        "sprint_id": 2,
        "sprint_name": "Sprint 23 — Polish",
        "status": "completed",
        "start_date": "2026-04-14",
        "end_date": "2026-04-25",
        "goal": "UI polish pass and CI improvements.",
        "current_team_load": 38,
        "deadline_limit": 40,
        "meeting_hours": 4,
        "support_hours": 2,
        "risk_tolerance": "Balanced",
    },
]

SKILL_OPTIONS = [
    "Backend",
    "Frontend",
    "API",
    "DevOps",
    "UI/UX",
    "Database",
    "Security",
    "Mobile",
]

KANBAN_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"]

# ── In-Memory Stores (fallback when no DB) ──

_mem_team = [dict(m) for m in DEFAULT_TEAM]
_mem_tasks = [dict(t) for t in DEFAULT_TASKS]
_mem_sprints = [dict(s) for s in DEFAULT_SPRINTS]
_mem_activity = [
    {
        "id": 1,
        "type": "sprint_created",
        "message": "Sprint 24 — Foundation was created",
        "actor": "System",
        "timestamp": "2026-04-28T09:00:00Z",
    },
    {
        "id": 2,
        "type": "task_assigned",
        "message": "Checkout API hardening assigned to Ava",
        "actor": "Planner",
        "timestamp": "2026-04-28T09:05:00Z",
    },
    {
        "id": 3,
        "type": "status_changed",
        "message": "Dashboard redesign moved to In Progress",
        "actor": "Noah",
        "timestamp": "2026-04-28T10:30:00Z",
    },
    {
        "id": 4,
        "type": "task_created",
        "message": "Security audit remediation added to backlog",
        "actor": "System",
        "timestamp": "2026-04-28T11:00:00Z",
    },
    {
        "id": 5,
        "type": "analysis_run",
        "message": "Sprint analysis generated — delivery status: Watch",
        "actor": "Planner",
        "timestamp": "2026-04-28T14:20:00Z",
    },
]
_mem_next_activity_id = 6


def get_engine():
    try:
        return create_engine(
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}",
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 2,
                "read_timeout": 2,
                "write_timeout": 2,
            },
        )
    except Exception:
        return None


engine = get_engine()


def _parse_timestamp(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value

    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00") if value.endswith("Z") else value
        parsed = datetime.fromisoformat(normalized)
        return parsed.astimezone(timezone.utc).replace(tzinfo=None) if parsed.tzinfo else parsed

    return value


def _serialize_timestamp(value):
    if isinstance(value, datetime):
        if value.tzinfo:
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        return value.isoformat() + "Z"

    return value


def db_available() -> bool:
    if engine is None:
        return False

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False


def ensure_runtime_schema() -> None:
    if not db_available():
        return

    statements = [
        """
        CREATE TABLE IF NOT EXISTS developers (
            dev_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            experience_level VARCHAR(20) NOT NULL,
            primary_skill VARCHAR(50) NOT NULL,
            secondary_skill VARCHAR(50),
            current_load FLOAT DEFAULT 0,
            max_capacity FLOAT DEFAULT 40,
            availability_pct FLOAT DEFAULT 100,
            focus_factor FLOAT DEFAULT 1.0,
            PRIMARY KEY (dev_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS sprint_table (
            task_id INT NOT NULL,
            sprint_id INT DEFAULT 1,
            title VARCHAR(150),
            description TEXT,
            story_points INT,
            priority VARCHAR(20),
            status VARCHAR(50),
            skill_tag VARCHAR(50),
            task_type VARCHAR(30),
            dependencies VARCHAR(255),
            due_in_days INT,
            assignee_hint VARCHAR(100),
            confidence INT,
            must_do BOOLEAN DEFAULT 0,
            assigned_to VARCHAR(100),
            predicted_hours FLOAT,
            risk_score FLOAT,
            PRIMARY KEY (task_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS sprints (
            sprint_id INT NOT NULL,
            sprint_name VARCHAR(150) NOT NULL,
            status VARCHAR(30) DEFAULT 'planning',
            start_date DATE NULL,
            end_date DATE NULL,
            goal TEXT,
            current_team_load FLOAT DEFAULT 40,
            deadline_limit FLOAT DEFAULT 40,
            meeting_hours FLOAT DEFAULT 4,
            support_hours FLOAT DEFAULT 2,
            risk_tolerance VARCHAR(30) DEFAULT 'Balanced',
            PRIMARY KEY (sprint_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS sprint_snapshots (
            snapshot_id INT NOT NULL AUTO_INCREMENT,
            sprint_name VARCHAR(150) NOT NULL,
            summary_json LONGTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (snapshot_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS activity_log (
            id INT NOT NULL AUTO_INCREMENT,
            type VARCHAR(60) NOT NULL,
            message TEXT NOT NULL,
            actor VARCHAR(100) DEFAULT 'System',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
        """,
    ]

    alter_statements = [
        "ALTER TABLE developers ADD COLUMN secondary_skill VARCHAR(50)",
        "ALTER TABLE developers ADD COLUMN current_load FLOAT DEFAULT 0",
        "ALTER TABLE developers ADD COLUMN max_capacity FLOAT DEFAULT 40",
        "ALTER TABLE developers ADD COLUMN availability_pct FLOAT DEFAULT 100",
        "ALTER TABLE developers ADD COLUMN focus_factor FLOAT DEFAULT 1.0",
        "ALTER TABLE sprint_table ADD COLUMN sprint_id INT DEFAULT 1",
        "ALTER TABLE sprint_table ADD COLUMN title VARCHAR(150)",
        "ALTER TABLE sprint_table ADD COLUMN description TEXT",
        "ALTER TABLE sprint_table ADD COLUMN skill_tag VARCHAR(50)",
        "ALTER TABLE sprint_table ADD COLUMN task_type VARCHAR(30)",
        "ALTER TABLE sprint_table ADD COLUMN dependencies VARCHAR(255)",
        "ALTER TABLE sprint_table ADD COLUMN due_in_days INT",
        "ALTER TABLE sprint_table ADD COLUMN assignee_hint VARCHAR(100)",
        "ALTER TABLE sprint_table ADD COLUMN confidence INT",
        "ALTER TABLE sprint_table ADD COLUMN must_do BOOLEAN DEFAULT 0",
        "ALTER TABLE sprint_table ADD COLUMN assigned_to VARCHAR(100)",
        "ALTER TABLE sprint_table ADD COLUMN predicted_hours FLOAT",
        "ALTER TABLE sprint_table ADD COLUMN risk_score FLOAT",
    ]

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))
        for statement in alter_statements:
            try:
                conn.execute(text(statement))
            except SQLAlchemyError:
                pass


def seed_defaults_if_empty() -> None:
    if not db_available():
        return

    ensure_runtime_schema()

    with engine.begin() as conn:
        dev_count = conn.execute(text("SELECT COUNT(*) FROM developers")).scalar() or 0
        task_count = conn.execute(text("SELECT COUNT(*) FROM sprint_table")).scalar() or 0
        sprint_count = conn.execute(text("SELECT COUNT(*) FROM sprints")).scalar() or 0
        activity_count = conn.execute(text("SELECT COUNT(*) FROM activity_log")).scalar() or 0

        if sprint_count == 0:
            for sprint in DEFAULT_SPRINTS:
                conn.execute(
                    text(
                        """
                        INSERT INTO sprints (
                            sprint_id, sprint_name, status, start_date, end_date, goal,
                            current_team_load, deadline_limit, meeting_hours, support_hours, risk_tolerance
                        ) VALUES (
                            :sprint_id, :sprint_name, :status, :start_date, :end_date, :goal,
                            :current_team_load, :deadline_limit, :meeting_hours, :support_hours, :risk_tolerance
                        )
                        """
                    ),
                    sprint,
                )

        if dev_count == 0:
            for member in DEFAULT_TEAM:
                conn.execute(
                    text(
                        """
                        INSERT INTO developers (
                            dev_id, name, experience_level, primary_skill, secondary_skill,
                            current_load, max_capacity, availability_pct, focus_factor
                        ) VALUES (
                            :dev_id, :name, :experience_level, :primary_skill, :secondary_skill,
                            :current_load, :max_capacity, :availability_pct, :focus_factor
                        )
                        """
                    ),
                    member,
                )

        if task_count == 0:
            for task in DEFAULT_TASKS:
                payload = dict(task)
                payload["dependencies"] = ",".join(str(dep) for dep in task["dependencies"])
                payload["status"] = payload.get("status", "Unassigned")
                payload["risk_score"] = 0.0
                payload["predicted_hours"] = 0.0
                payload["sprint_id"] = 1
                conn.execute(
                    text(
                        """
                        INSERT INTO sprint_table (
                            task_id, sprint_id, title, description, story_points, priority, status, skill_tag,
                            task_type, dependencies, due_in_days, assignee_hint, confidence,
                            must_do, assigned_to, predicted_hours, risk_score
                        ) VALUES (
                            :task_id, :sprint_id, :title, :description, :story_points, :priority, :status, :skill_tag,
                            :task_type, :dependencies, :due_in_days, :assignee_hint, :confidence,
                            :must_do, '', :predicted_hours, :risk_score
                        )
                        """
                    ),
                    payload,
                )

        if activity_count == 0:
            for entry in _mem_activity:
                payload = dict(entry)
                payload["timestamp"] = _parse_timestamp(payload["timestamp"])
                conn.execute(
                    text(
                        """
                        INSERT INTO activity_log (id, type, message, actor, created_at)
                        VALUES (:id, :type, :message, :actor, :timestamp)
                        """
                    ),
                    payload,
                )


def fetch_team_members():
    if not db_available():
        return [dict(member) for member in _mem_team]

    ensure_runtime_schema()
    seed_defaults_if_empty()

    query = text(
        """
        SELECT
            dev_id,
            name,
            experience_level,
            primary_skill,
            secondary_skill,
            COALESCE(current_load, 0) AS current_load,
            COALESCE(max_capacity, 40) AS max_capacity,
            COALESCE(availability_pct, 100) AS availability_pct,
            COALESCE(focus_factor, 1.0) AS focus_factor
        FROM developers
        ORDER BY experience_level DESC, name ASC
        LIMIT 24
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()

    if not rows:
        return [dict(member) for member in _mem_team]

    return [dict(row) for row in rows]


def create_team_member(member: dict) -> dict:
    global _mem_team
    if db_available():
        ensure_runtime_schema()
        seed_defaults_if_empty()
        with engine.begin() as conn:
            next_id = (conn.execute(text("SELECT COALESCE(MAX(dev_id), 0) + 1 FROM developers")).scalar() or 1)
            new_member = {
                "dev_id": int(next_id),
                "name": member.get("name", "New Member"),
                "experience_level": member.get("experience_level", "Mid"),
                "primary_skill": member.get("primary_skill", "Backend"),
                "secondary_skill": member.get("secondary_skill"),
                "current_load": float(member.get("current_load", 0)),
                "max_capacity": float(member.get("max_capacity", 40)),
                "availability_pct": float(member.get("availability_pct", 100)),
                "focus_factor": float(member.get("focus_factor", 1.0)),
            }
            conn.execute(
                text(
                    """
                    INSERT INTO developers (
                        dev_id, name, experience_level, primary_skill, secondary_skill,
                        current_load, max_capacity, availability_pct, focus_factor
                    ) VALUES (
                        :dev_id, :name, :experience_level, :primary_skill, :secondary_skill,
                        :current_load, :max_capacity, :availability_pct, :focus_factor
                    )
                    """
                ),
                new_member,
            )
        _log_activity("member_added", f"{new_member['name']} joined the team", "System")
        return new_member

    existing_ids = [m["dev_id"] for m in _mem_team]
    next_id = max(existing_ids) + 1 if existing_ids else 1
    new_member = {
        "dev_id": next_id,
        "name": member.get("name", "New Member"),
        "experience_level": member.get("experience_level", "Mid"),
        "primary_skill": member.get("primary_skill", "Backend"),
        "secondary_skill": member.get("secondary_skill"),
        "current_load": float(member.get("current_load", 0)),
        "max_capacity": float(member.get("max_capacity", 40)),
        "availability_pct": float(member.get("availability_pct", 100)),
        "focus_factor": float(member.get("focus_factor", 1.0)),
    }
    _mem_team.append(new_member)
    _log_activity("member_added", f"{new_member['name']} joined the team", "System")
    return new_member


def update_team_member(dev_id: int, updates: dict) -> dict | None:
    global _mem_team
    if db_available():
        ensure_runtime_schema()
        payload = {
            "dev_id": dev_id,
            "name": updates.get("name"),
            "experience_level": updates.get("experience_level"),
            "primary_skill": updates.get("primary_skill"),
            "secondary_skill": updates.get("secondary_skill"),
            "current_load": float(updates.get("current_load", 0)),
            "max_capacity": float(updates.get("max_capacity", 40)),
            "availability_pct": float(updates.get("availability_pct", 100)),
            "focus_factor": float(updates.get("focus_factor", 1.0)),
        }
        with engine.begin() as conn:
            result = conn.execute(
                text(
                    """
                    UPDATE developers
                    SET name = :name,
                        experience_level = :experience_level,
                        primary_skill = :primary_skill,
                        secondary_skill = :secondary_skill,
                        current_load = :current_load,
                        max_capacity = :max_capacity,
                        availability_pct = :availability_pct,
                        focus_factor = :focus_factor
                    WHERE dev_id = :dev_id
                    """
                ),
                payload,
            )
        if result.rowcount == 0:
            return None
        _log_activity("member_updated", f"{payload['name']} profile updated", "System")
        return next((m for m in fetch_team_members() if m["dev_id"] == dev_id), None)

    for i, member in enumerate(_mem_team):
        if member["dev_id"] == dev_id:
            for key, value in updates.items():
                if key in member and key != "dev_id":
                    _mem_team[i][key] = value
            _log_activity("member_updated", f"{_mem_team[i]['name']} profile updated", "System")
            return dict(_mem_team[i])
    return None


def delete_team_member(dev_id: int) -> bool:
    global _mem_team
    if db_available():
        ensure_runtime_schema()
        existing = next((m for m in fetch_team_members() if m["dev_id"] == dev_id), None)
        if existing is None:
            return False
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM developers WHERE dev_id = :dev_id"), {"dev_id": dev_id})
        _log_activity("member_removed", f"{existing['name']} was removed from the team", "System")
        return True

    for i, member in enumerate(_mem_team):
        if member["dev_id"] == dev_id:
            name = member["name"]
            _mem_team.pop(i)
            _log_activity("member_removed", f"{name} was removed from the team", "System")
            return True
    return False


def fetch_backlog():
    if not db_available():
        return [dict(task) for task in _mem_tasks]

    ensure_runtime_schema()
    seed_defaults_if_empty()

    query = text(
        """
        SELECT
            task_id,
            COALESCE(sprint_id, 1) AS sprint_id,
            COALESCE(title, CONCAT('Task ', task_id)) AS title,
            COALESCE(description, '') AS description,
            COALESCE(story_points, 1) AS story_points,
            COALESCE(priority, 'Medium') AS priority,
            COALESCE(status, 'Backlog') AS status,
            COALESCE(assigned_to, '') AS assigned_to,
            COALESCE(predicted_hours, 0) AS predicted_hours,
            COALESCE(risk_score, 0) AS risk_score,
            COALESCE(skill_tag, 'Backend') AS skill_tag,
            COALESCE(task_type, 'Feature') AS task_type,
            COALESCE(dependencies, '') AS dependencies,
            COALESCE(due_in_days, 10) AS due_in_days,
            COALESCE(assignee_hint, '') AS assignee_hint,
            COALESCE(confidence, 70) AS confidence,
            COALESCE(must_do, 0) AS must_do
        FROM sprint_table
        ORDER BY task_id ASC
        LIMIT 60
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()

    backlog = []
    for row in rows:
        item = dict(row)
        raw_dependencies = item.get("dependencies") or ""
        item["dependencies"] = [
            int(token)
            for token in str(raw_dependencies).split(",")
            if str(token).strip().isdigit()
        ]
        item["must_do"] = bool(item.get("must_do"))
        backlog.append(item)

    return backlog or [dict(task) for task in _mem_tasks]


def fetch_tasks_with_status():
    """Return all tasks with their Kanban status."""
    if db_available():
        return fetch_backlog()
    return [dict(task) for task in _mem_tasks]


def create_task(task: dict) -> dict:
    global _mem_tasks
    if db_available():
        ensure_runtime_schema()
        seed_defaults_if_empty()
        with engine.begin() as conn:
            next_id = (
                conn.execute(text("SELECT COALESCE(MAX(task_id), 0) + 1 FROM sprint_table")).scalar()
                or 1
            )
            new_task = {
                "task_id": int(next_id),
                "sprint_id": int(task.get("sprint_id", 1) or 1),
                "title": task.get("title", "New backlog item"),
                "description": task.get("description", ""),
                "story_points": int(task.get("story_points", 1) or 1),
                "priority": task.get("priority", "Medium"),
                "status": task.get("status", "Backlog"),
                "skill_tag": task.get("skill_tag", "Backend"),
                "task_type": task.get("task_type", "Feature"),
                "dependencies": ",".join(str(dep) for dep in task.get("dependencies", [])),
                "due_in_days": int(task.get("due_in_days", 10) or 10),
                "assignee_hint": task.get("assignee_hint", ""),
                "confidence": int(task.get("confidence", 70) or 70),
                "must_do": bool(task.get("must_do", False)),
                "assigned_to": task.get("assigned_to", ""),
                "predicted_hours": float(task.get("predicted_hours", 0) or 0),
                "risk_score": float(task.get("risk_score", 0) or 0),
            }
            conn.execute(
                text(
                    """
                    INSERT INTO sprint_table (
                        task_id, sprint_id, title, description, story_points, priority, status, skill_tag,
                        task_type, dependencies, due_in_days, assignee_hint, confidence,
                        must_do, assigned_to, predicted_hours, risk_score
                    ) VALUES (
                        :task_id, :sprint_id, :title, :description, :story_points, :priority, :status, :skill_tag,
                        :task_type, :dependencies, :due_in_days, :assignee_hint, :confidence,
                        :must_do, :assigned_to, :predicted_hours, :risk_score
                    )
                    """
                ),
                new_task,
            )
        _log_activity("task_created", f"{new_task['title']} added to backlog", "System")
        return next((item for item in fetch_backlog() if item["task_id"] == new_task["task_id"]), new_task)

    existing_ids = [t["task_id"] for t in _mem_tasks]
    next_id = max(existing_ids) + 1 if existing_ids else 1
    new_task = {
        "task_id": next_id,
        "sprint_id": int(task.get("sprint_id", 1) or 1),
        "title": task.get("title", "New backlog item"),
        "description": task.get("description", ""),
        "story_points": int(task.get("story_points", 1) or 1),
        "priority": task.get("priority", "Medium"),
        "status": task.get("status", "Backlog"),
        "skill_tag": task.get("skill_tag", "Backend"),
        "task_type": task.get("task_type", "Feature"),
        "dependencies": [int(dep) for dep in task.get("dependencies", []) if str(dep).isdigit()],
        "due_in_days": int(task.get("due_in_days", 10) or 10),
        "assignee_hint": task.get("assignee_hint", ""),
        "confidence": int(task.get("confidence", 70) or 70),
        "must_do": bool(task.get("must_do", False)),
        "assigned_to": task.get("assigned_to", ""),
        "predicted_hours": float(task.get("predicted_hours", 0) or 0),
        "risk_score": float(task.get("risk_score", 0) or 0),
    }
    _mem_tasks.append(new_task)
    _log_activity("task_created", f"{new_task['title']} added to backlog", "System")
    return dict(new_task)


def update_task(task_id: int, updates: dict) -> dict | None:
    global _mem_tasks
    if db_available():
        ensure_runtime_schema()
        existing = next((task for task in fetch_backlog() if task["task_id"] == task_id), None)
        if existing is None:
            return None
        payload = {
            "task_id": task_id,
            "sprint_id": int(updates.get("sprint_id", existing.get("sprint_id", 1)) or 1),
            "title": updates.get("title", existing.get("title", "Task")),
            "description": updates.get("description", existing.get("description", "")),
            "story_points": int(updates.get("story_points", existing.get("story_points", 1)) or 1),
            "priority": updates.get("priority", existing.get("priority", "Medium")),
            "status": updates.get("status", existing.get("status", "Backlog")),
            "skill_tag": updates.get("skill_tag", existing.get("skill_tag", "Backend")),
            "task_type": updates.get("task_type", existing.get("task_type", "Feature")),
            "dependencies": ",".join(str(dep) for dep in updates.get("dependencies", existing.get("dependencies", []))),
            "due_in_days": int(updates.get("due_in_days", existing.get("due_in_days", 10)) or 10),
            "assignee_hint": updates.get("assignee_hint", existing.get("assignee_hint", "")),
            "confidence": int(updates.get("confidence", existing.get("confidence", 70)) or 70),
            "must_do": bool(updates.get("must_do", existing.get("must_do", False))),
            "assigned_to": updates.get("assigned_to", existing.get("assigned_to", "")),
            "predicted_hours": float(updates.get("predicted_hours", existing.get("predicted_hours", 0)) or 0),
            "risk_score": float(updates.get("risk_score", existing.get("risk_score", 0)) or 0),
        }
        with engine.begin() as conn:
            result = conn.execute(
                text(
                    """
                    UPDATE sprint_table
                    SET sprint_id = :sprint_id,
                        title = :title,
                        description = :description,
                        story_points = :story_points,
                        priority = :priority,
                        status = :status,
                        skill_tag = :skill_tag,
                        task_type = :task_type,
                        dependencies = :dependencies,
                        due_in_days = :due_in_days,
                        assignee_hint = :assignee_hint,
                        confidence = :confidence,
                        must_do = :must_do,
                        assigned_to = :assigned_to,
                        predicted_hours = :predicted_hours,
                        risk_score = :risk_score
                    WHERE task_id = :task_id
                    """
                ),
                payload,
            )
        if result.rowcount == 0:
            return None
        _log_activity("task_updated", f"{payload['title']} backlog details updated", "System")
        return next((item for item in fetch_backlog() if item["task_id"] == task_id), None)

    for i, task in enumerate(_mem_tasks):
        if task["task_id"] == task_id:
            updated = {
                **task,
                "sprint_id": int(updates.get("sprint_id", task.get("sprint_id", 1)) or 1),
                "title": updates.get("title", task.get("title", "Task")),
                "description": updates.get("description", task.get("description", "")),
                "story_points": int(updates.get("story_points", task.get("story_points", 1)) or 1),
                "priority": updates.get("priority", task.get("priority", "Medium")),
                "status": updates.get("status", task.get("status", "Backlog")),
                "skill_tag": updates.get("skill_tag", task.get("skill_tag", "Backend")),
                "task_type": updates.get("task_type", task.get("task_type", "Feature")),
                "dependencies": [
                    int(dep)
                    for dep in updates.get("dependencies", task.get("dependencies", []))
                    if str(dep).isdigit()
                ],
                "due_in_days": int(updates.get("due_in_days", task.get("due_in_days", 10)) or 10),
                "assignee_hint": updates.get("assignee_hint", task.get("assignee_hint", "")),
                "confidence": int(updates.get("confidence", task.get("confidence", 70)) or 70),
                "must_do": bool(updates.get("must_do", task.get("must_do", False))),
                "assigned_to": updates.get("assigned_to", task.get("assigned_to", "")),
                "predicted_hours": float(updates.get("predicted_hours", task.get("predicted_hours", 0)) or 0),
                "risk_score": float(updates.get("risk_score", task.get("risk_score", 0)) or 0),
            }
            _mem_tasks[i] = updated
            _log_activity("task_updated", f"{updated['title']} backlog details updated", "System")
            return dict(updated)
    return None


def delete_task(task_id: int) -> bool:
    global _mem_tasks
    if db_available():
        ensure_runtime_schema()
        existing = next((task for task in fetch_backlog() if task["task_id"] == task_id), None)
        if existing is None:
            return False
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM sprint_table WHERE task_id = :task_id"), {"task_id": task_id})
        _log_activity("task_deleted", f"{existing['title']} removed from backlog", "System")
        return True

    for i, task in enumerate(_mem_tasks):
        if task["task_id"] == task_id:
            title = task["title"]
            _mem_tasks.pop(i)
            _log_activity("task_deleted", f"{title} removed from backlog", "System")
            return True
    return False


def update_task_status(task_id: int, new_status: str) -> dict | None:
    global _mem_tasks
    if new_status not in KANBAN_COLUMNS:
        return None
    if db_available():
        ensure_runtime_schema()
        existing = next((task for task in fetch_backlog() if task["task_id"] == task_id), None)
        if existing is None:
            return None
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE sprint_table SET status = :status WHERE task_id = :task_id"),
                {"status": new_status, "task_id": task_id},
            )
        _log_activity(
            "status_changed",
            f"{existing['title']} moved from {existing.get('status', 'Backlog')} to {new_status}",
            "User",
        )
        return next((task for task in fetch_backlog() if task["task_id"] == task_id), None)

    for i, task in enumerate(_mem_tasks):
        if task["task_id"] == task_id:
            old_status = task.get("status", "Backlog")
            _mem_tasks[i]["status"] = new_status
            _log_activity(
                "status_changed",
                f"{task['title']} moved from {old_status} to {new_status}",
                "User",
            )
            return dict(_mem_tasks[i])
    return None


def fetch_sprints():
    if db_available():
        ensure_runtime_schema()
        seed_defaults_if_empty()
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT sprint_id, sprint_name, status, start_date, end_date, goal,
                           current_team_load, deadline_limit, meeting_hours, support_hours, risk_tolerance
                    FROM sprints
                    ORDER BY sprint_id DESC
                    """
                )
            ).mappings().all()
        return [dict(row) for row in rows]
    return [dict(s) for s in _mem_sprints]


def create_sprint(sprint: dict) -> dict:
    global _mem_sprints
    if db_available():
        ensure_runtime_schema()
        seed_defaults_if_empty()
        with engine.begin() as conn:
            next_id = (conn.execute(text("SELECT COALESCE(MAX(sprint_id), 0) + 1 FROM sprints")).scalar() or 1)
            new_sprint = {
                "sprint_id": int(next_id),
                "sprint_name": sprint.get("sprint_name", f"Sprint {next_id}"),
                "status": "planning",
                "start_date": sprint.get("start_date") or None,
                "end_date": sprint.get("end_date") or None,
                "goal": sprint.get("goal", ""),
                "current_team_load": float(sprint.get("current_team_load", 40)),
                "deadline_limit": float(sprint.get("deadline_limit", 40)),
                "meeting_hours": float(sprint.get("meeting_hours", 4)),
                "support_hours": float(sprint.get("support_hours", 2)),
                "risk_tolerance": sprint.get("risk_tolerance", "Balanced"),
            }
            conn.execute(
                text(
                    """
                    INSERT INTO sprints (
                        sprint_id, sprint_name, status, start_date, end_date, goal,
                        current_team_load, deadline_limit, meeting_hours, support_hours, risk_tolerance
                    ) VALUES (
                        :sprint_id, :sprint_name, :status, :start_date, :end_date, :goal,
                        :current_team_load, :deadline_limit, :meeting_hours, :support_hours, :risk_tolerance
                    )
                    """
                ),
                new_sprint,
            )
        _log_activity("sprint_created", f"{new_sprint['sprint_name']} was created", "System")
        return new_sprint

    existing_ids = [s["sprint_id"] for s in _mem_sprints]
    next_id = max(existing_ids) + 1 if existing_ids else 1
    new_sprint = {
        "sprint_id": next_id,
        "sprint_name": sprint.get("sprint_name", f"Sprint {next_id}"),
        "status": "planning",
        "start_date": sprint.get("start_date", ""),
        "end_date": sprint.get("end_date", ""),
        "goal": sprint.get("goal", ""),
        "current_team_load": float(sprint.get("current_team_load", 40)),
        "deadline_limit": float(sprint.get("deadline_limit", 40)),
        "meeting_hours": float(sprint.get("meeting_hours", 4)),
        "support_hours": float(sprint.get("support_hours", 2)),
        "risk_tolerance": sprint.get("risk_tolerance", "Balanced"),
    }
    _mem_sprints.insert(0, new_sprint)
    _log_activity("sprint_created", f"{new_sprint['sprint_name']} was created", "System")
    return new_sprint


def update_sprint(sprint_id: int, updates: dict) -> dict | None:
    global _mem_sprints
    if db_available():
        ensure_runtime_schema()
        payload = {
            "sprint_id": sprint_id,
            "sprint_name": updates.get("sprint_name", f"Sprint {sprint_id}"),
            "start_date": updates.get("start_date") or None,
            "end_date": updates.get("end_date") or None,
            "goal": updates.get("goal", ""),
            "current_team_load": float(updates.get("current_team_load", 40)),
            "deadline_limit": float(updates.get("deadline_limit", 40)),
            "meeting_hours": float(updates.get("meeting_hours", 4)),
            "support_hours": float(updates.get("support_hours", 2)),
            "risk_tolerance": updates.get("risk_tolerance", "Balanced"),
        }
        with engine.begin() as conn:
            result = conn.execute(
                text(
                    """
                    UPDATE sprints
                    SET sprint_name = :sprint_name,
                        start_date = :start_date,
                        end_date = :end_date,
                        goal = :goal,
                        current_team_load = :current_team_load,
                        deadline_limit = :deadline_limit,
                        meeting_hours = :meeting_hours,
                        support_hours = :support_hours,
                        risk_tolerance = :risk_tolerance
                    WHERE sprint_id = :sprint_id
                    """
                ),
                payload,
            )
        if result.rowcount == 0:
            return None
        _log_activity("sprint_updated", f"{payload['sprint_name']} was updated", "System")
        return next((s for s in fetch_sprints() if s["sprint_id"] == sprint_id), None)

    for i, sprint in enumerate(_mem_sprints):
        if sprint["sprint_id"] == sprint_id:
            for key, value in updates.items():
                if key in sprint and key != "sprint_id":
                    _mem_sprints[i][key] = value
            _log_activity("sprint_updated", f"{_mem_sprints[i]['sprint_name']} was updated", "System")
            return dict(_mem_sprints[i])
    return None


def delete_sprint(sprint_id: int) -> bool:
    global _mem_sprints
    if db_available():
        ensure_runtime_schema()
        existing = next((s for s in fetch_sprints() if s["sprint_id"] == sprint_id), None)
        if existing is None:
            return False
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM sprints WHERE sprint_id = :sprint_id"), {"sprint_id": sprint_id})
            conn.execute(
                text("UPDATE sprint_table SET sprint_id = 1 WHERE sprint_id = :sprint_id"),
                {"sprint_id": sprint_id},
            )
        _log_activity("sprint_deleted", f"{existing['sprint_name']} was deleted", "System")
        return True

    for i, sprint in enumerate(_mem_sprints):
        if sprint["sprint_id"] == sprint_id:
            name = sprint["sprint_name"]
            _mem_sprints.pop(i)
            _log_activity("sprint_deleted", f"{name} was deleted", "System")
            return True
    return False


def duplicate_sprint(sprint_id: int) -> dict | None:
    global _mem_sprints
    if db_available():
        ensure_runtime_schema()
        source = next((s for s in fetch_sprints() if s["sprint_id"] == sprint_id), None)
        if source is None:
            return None
        return create_sprint(
            {
                **source,
                "sprint_name": f"{source['sprint_name']} (copy)",
                "start_date": source.get("start_date") or "",
                "end_date": source.get("end_date") or "",
            }
        )

    for sprint in _mem_sprints:
        if sprint["sprint_id"] == sprint_id:
            new_sprint = deepcopy(sprint)
            existing_ids = [s["sprint_id"] for s in _mem_sprints]
            new_sprint["sprint_id"] = max(existing_ids) + 1
            new_sprint["sprint_name"] = f"{sprint['sprint_name']} (copy)"
            new_sprint["status"] = "planning"
            _mem_sprints.insert(0, new_sprint)
            _log_activity("sprint_duplicated", f"{sprint['sprint_name']} was duplicated", "System")
            return new_sprint
    return None


def _log_activity(event_type: str, message: str, actor: str = "System"):
    global _mem_next_activity_id, _mem_activity
    if db_available():
        ensure_runtime_schema()
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO activity_log (type, message, actor)
                    VALUES (:type, :message, :actor)
                    """
                ),
                {"type": event_type, "message": message, "actor": actor},
            )
        return

    _mem_activity.insert(0, {
        "id": _mem_next_activity_id,
        "type": event_type,
        "message": message,
        "actor": actor,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })
    _mem_next_activity_id += 1
    # Keep only last 100 entries
    _mem_activity = _mem_activity[:100]


def fetch_activity(limit: int = 50):
    if db_available():
        ensure_runtime_schema()
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT id, type, message, actor, created_at AS timestamp
                    FROM activity_log
                    ORDER BY id DESC
                    LIMIT :limit
                    """
                ),
                {"limit": limit},
            ).mappings().all()
        activity = []
        for row in rows:
            entry = dict(row)
            entry["timestamp"] = _serialize_timestamp(entry.get("timestamp"))
            activity.append(entry)
        return activity
    return _mem_activity[:limit]


def get_velocity_data(sprint_id: int):
    """Generate velocity / burndown data for a sprint."""
    if db_available():
        ensure_runtime_schema()
        with engine.connect() as conn:
            sprint = conn.execute(
                text(
                    """
                    SELECT sprint_id, sprint_name, status, start_date, end_date, goal,
                           current_team_load, deadline_limit, meeting_hours, support_hours, risk_tolerance
                    FROM sprints
                    WHERE sprint_id = :sprint_id
                    """
                ),
                {"sprint_id": sprint_id},
            ).mappings().first()
            if sprint is None:
                return None
            task_rows = conn.execute(
                text(
                    """
                    SELECT story_points, status
                    FROM sprint_table
                    WHERE sprint_id = :sprint_id
                    """
                ),
                {"sprint_id": sprint_id},
            ).mappings().all()
            velocity_rows = conn.execute(
                text(
                    """
                    SELECT s.sprint_name, s.sprint_id, COALESCE(SUM(t.story_points), 0) AS points
                    FROM sprints s
                    LEFT JOIN sprint_table t ON t.sprint_id = s.sprint_id
                    GROUP BY s.sprint_id, s.sprint_name
                    ORDER BY s.sprint_id
                    """
                )
            ).mappings().all()

        total_points = sum(int(row["story_points"] or 0) for row in task_rows)
        completed_points = sum(
            int(row["story_points"] or 0)
            for row in task_rows
            if row.get("status") == "Done"
        )
        days = 10
        remaining = total_points
        burndown = []
        for day in range(days + 1):
            ideal = round(total_points - (total_points / max(days, 1)) * day, 1)
            actual = round(max(0, remaining), 1)
            burndown.append({"day": day, "ideal": ideal, "actual": actual})
            if day < days:
                completed_so_far = completed_points / max(days, 1)
                remaining = max(0, remaining - completed_so_far)

        return {
            "sprint": dict(sprint),
            "burndown": burndown,
            "velocity": [
                {"sprint": row["sprint_name"], "points": float(row["points"] or 0)}
                for row in velocity_rows
            ],
            "total_points": total_points,
            "completed_points": completed_points,
        }

    sprint = None
    for s in _mem_sprints:
        if s["sprint_id"] == sprint_id:
            sprint = s
            break
    if not sprint:
        return None

    # Generate sample burndown data
    total_points = sum(t.get("story_points", 0) for t in _mem_tasks)
    days = 10
    burndown = []
    remaining = total_points
    for day in range(days + 1):
        burndown.append({
            "day": day,
            "ideal": round(total_points - (total_points / days) * day, 1),
            "actual": round(remaining, 1),
        })
        # Simulate some work done
        if day < days:
            remaining = max(0, remaining - (total_points / days) * (0.6 + (day * 0.08)))

    velocity = [
        {"sprint": "Sprint 21", "points": 34},
        {"sprint": "Sprint 22", "points": 41},
        {"sprint": "Sprint 23", "points": 38},
        {"sprint": "Sprint 24", "points": total_points},
    ]

    return {
        "sprint": sprint,
        "burndown": burndown,
        "velocity": velocity,
        "total_points": total_points,
        "completed_points": sum(
            t.get("story_points", 0) for t in _mem_tasks if t.get("status") == "Done"
        ),
    }


def upsert_backlog(tasks) -> None:
    if not db_available():
        return

    ensure_runtime_schema()

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM sprint_table"))
        for task in tasks:
            payload = dict(task)
            payload.setdefault("description", "")
            payload.setdefault("sprint_id", 1)
            payload.setdefault("priority", "Medium")
            payload.setdefault("skill_tag", "Backend")
            payload.setdefault("task_type", "Feature")
            payload.setdefault("due_in_days", 10)
            payload.setdefault("assignee_hint", "")
            payload.setdefault("confidence", 70)
            payload.setdefault("must_do", False)
            payload["dependencies"] = ",".join(
                str(dep) for dep in payload.get("dependencies", [])
            )
            payload["status"] = payload.get("status", "Planned")
            payload["assigned_to"] = payload.get("assigned_to", "")
            payload["predicted_hours"] = payload.get("predicted_hours", 0.0)
            payload["risk_score"] = payload.get("risk_score", 0.0)

            conn.execute(
                text(
                    """
                    INSERT INTO sprint_table (
                        task_id, sprint_id, title, description, story_points, priority, status, skill_tag,
                        task_type, dependencies, due_in_days, assignee_hint, confidence,
                        must_do, assigned_to, predicted_hours, risk_score
                    ) VALUES (
                        :task_id, :sprint_id, :title, :description, :story_points, :priority, :status, :skill_tag,
                        :task_type, :dependencies, :due_in_days, :assignee_hint, :confidence,
                        :must_do, :assigned_to, :predicted_hours, :risk_score
                    )
                    """
                ),
                payload,
            )


def save_snapshot(sprint_name: str, summary: dict) -> int | None:
    if not db_available():
        _log_activity("analysis_run", f"Sprint analysis completed for {sprint_name}", "Planner")
        return None

    ensure_runtime_schema()

    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                INSERT INTO sprint_snapshots (sprint_name, summary_json)
                VALUES (:sprint_name, :summary_json)
                """
            ),
            {"sprint_name": sprint_name, "summary_json": json.dumps(summary)},
        )
        _log_activity("analysis_run", f"Sprint analysis completed for {sprint_name}", "Planner")
        return result.lastrowid


def fetch_history(limit: int = 6):
    if not db_available():
        return []

    ensure_runtime_schema()

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT snapshot_id, sprint_name, summary_json, created_at
                FROM sprint_snapshots
                ORDER BY snapshot_id DESC
                LIMIT :limit
                """
            ),
            {"limit": limit},
        ).mappings().all()

    history = []
    for row in rows:
        parsed = dict(row)
        try:
            parsed["summary"] = json.loads(parsed.pop("summary_json"))
        except json.JSONDecodeError:
            parsed["summary"] = {}
            parsed.pop("summary_json", None)
        history.append(parsed)

    return history
