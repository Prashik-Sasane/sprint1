from __future__ import annotations

from sqlalchemy import text

from train_brain.runtime import fetch_backlog, fetch_team_members, upsert_backlog, engine, db_available
from train_brain.use_ai import create_assignment_plan


def run_auto_assignment(payload: dict | None = None):
    tasks = payload.get("tasks") if payload else fetch_backlog()
    team_members = payload.get("team_members") if payload else fetch_team_members()
    sprint = payload.get("sprint") if payload else None

    if not sprint:
        sprint = {
            "sprint_name": "Auto Assignment Run",
            "current_team_load": 45,
            "deadline_limit": 40,
            "meeting_hours": 4,
            "support_hours": 2,
            "risk_tolerance": "Balanced",
        }

    analysis = create_assignment_plan(
        {"tasks": tasks, "team_members": team_members, "sprint": sprint}
    )
    if analysis.get("status") != "success":
        return analysis

    if db_available():
        persisted_tasks = []
        for task in analysis["tasks"]:
            persisted_tasks.append(
                {
                    "task_id": task["task_id"],
                    "sprint_id": task.get("sprint_id", 1),
                    "title": task["title"],
                    "description": task.get("description", ""),
                    "story_points": task["story_points"],
                    "priority": task["priority"],
                    "status": task.get("status") if task.get("status") in {"Backlog", "To Do", "In Progress", "Review", "Done"} else "To Do",
                    "skill_tag": task["skill_tag"],
                    "task_type": task["task_type"],
                    "dependencies": task["dependencies"],
                    "due_in_days": task["due_in_days"],
                    "assignee_hint": task["recommended_assignment"]["name"],
                    "confidence": task["confidence"],
                    "must_do": task["must_do"],
                    "assigned_to": task["recommended_assignment"]["name"],
                    "predicted_hours": task["predicted_hours"],
                    "risk_score": task["risk_pct"],
                }
            )
        upsert_backlog(persisted_tasks)

        with engine.begin() as conn:
            for assignment in analysis["assignments"]:
                conn.execute(
                    text(
                        """
                        UPDATE sprint_table
                        SET status = 'To Do',
                            assigned_to = :assigned_to,
                            predicted_hours = :predicted_hours,
                            risk_score = :risk_score
                        WHERE task_id = :task_id
                        """
                    ),
                    {
                        "task_id": assignment["task_id"],
                        "assigned_to": assignment["assigned_to"],
                        "predicted_hours": assignment["predicted_hours"],
                        "risk_score": assignment["risk_pct"],
                    },
                )

    return {
        "status": "success",
        "assigned": len(analysis["assignments"]),
        "assignments": analysis["assignments"],
        "metrics": analysis["metrics"],
        "delivery_status": analysis["delivery_status"],
    }
