from __future__ import annotations

from collections import Counter

from sqlalchemy import text

from train_brain.runtime import db_available, engine, fetch_history


def generate_sprint_analytics():
    history = fetch_history(limit=6)

    if not db_available():
        latest = history[0]["summary"] if history else {}
        return {
            "status": "success" if latest else "empty",
            "metrics": latest.get("metrics", {}),
            "team_workload": latest.get("team_workload", []),
            "portfolio": latest.get("portfolio", {}),
            "history": history,
            "insights": latest.get("insights", {}),
        }

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                    COALESCE(assigned_to, 'Unassigned') AS assigned_to,
                    COALESCE(predicted_hours, 0) AS predicted_hours,
                    COALESCE(risk_score, 0) AS risk_score,
                    COALESCE(priority, 'Medium') AS priority,
                    COALESCE(skill_tag, 'Backend') AS skill_tag,
                    COALESCE(status, 'Planned') AS status
                FROM sprint_table
                ORDER BY task_id ASC
                """
            )
        ).mappings().all()

    tasks = [dict(row) for row in rows]
    if not tasks:
        return {"status": "empty", "message": "No sprint tasks found.", "history": history}

    active_tasks = [task for task in tasks if task["status"] in {"Assigned", "Planned", "Backlog", "To Do", "In Progress", "Review", "Done"}]
    total_hours = round(sum(task["predicted_hours"] for task in active_tasks), 2)
    avg_risk = round(
        sum(task["risk_score"] for task in active_tasks) / max(len(active_tasks), 1),
        1,
    )

    workload_counter = Counter()
    risk_counter = Counter()
    priority_counter = Counter()
    skill_counter = Counter()

    for task in active_tasks:
        workload_counter[task["assigned_to"]] += task["predicted_hours"]
        risk_counter[task["assigned_to"]] += task["risk_score"]
        priority_counter[task["priority"]] += 1
        skill_counter[task["skill_tag"]] += 1

    team_workload = []
    for owner, hours in workload_counter.items():
        task_count = sum(1 for task in active_tasks if task["assigned_to"] == owner)
        team_workload.append(
            {
                "name": owner,
                "assigned_hours": round(hours, 2),
                "task_count": task_count,
                "avg_risk_pct": round(risk_counter[owner] / max(task_count, 1), 1),
            }
        )

    latest = history[0]["summary"] if history else {}

    return {
        "status": "success",
        "metrics": {
            "predicted_time": total_hours,
            "risk_score": avg_risk,
            "assigned_tasks": len([task for task in active_tasks if task["assigned_to"] != "Unassigned"]),
            "unassigned_tasks": len([task for task in active_tasks if task["assigned_to"] == "Unassigned"]),
        },
        "team_workload": sorted(team_workload, key=lambda item: item["assigned_hours"], reverse=True),
        "portfolio": {
            "priority_mix": [{"label": key, "value": value} for key, value in priority_counter.items()],
            "skill_mix": [{"label": key, "value": value} for key, value in skill_counter.items()],
        },
        "insights": latest.get("insights", {}),
        "history": history,
    }
