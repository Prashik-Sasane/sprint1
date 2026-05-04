from __future__ import annotations

from collections import Counter, defaultdict
from copy import deepcopy
from pathlib import Path

import joblib
import pandas as pd

from train_brain.runtime import fetch_team_members, save_snapshot


MODEL_DIR = Path(__file__).resolve().parent.parent
LEVEL_MAP = {"Junior": 1, "Mid": 2, "Senior": 3}
PRIORITY_WEIGHT = {"Low": 0.9, "Medium": 1.0, "High": 1.12, "Critical": 1.25}
TYPE_WEIGHT = {"Feature": 1.0, "Bug": 1.08, "Chore": 0.82, "Spike": 1.2}
RISK_TOLERANCE_SHIFT = {"Low": -4, "Balanced": 0, "Aggressive": 6}

time_model = None
risk_model = None


def initialize_models():
    global time_model, risk_model
    try:
        time_model = joblib.load(MODEL_DIR / "time_model.pkl")
        risk_model = joblib.load(MODEL_DIR / "risk_model.pkl")
    except Exception:
        time_model = None
        risk_model = None


initialize_models()


def _safe_predict(story_points: int, experience_level: str, team_load_pct: float):
    level_value = LEVEL_MAP.get(experience_level, 2)

    if time_model is None or risk_model is None:
        baseline = story_points * {1: 8.8, 2: 6.5, 3: 5.0}[level_value]
        risk = min(0.85, 0.18 + (story_points * 0.03) + ((110 - team_load_pct) / 500))
        return baseline, risk

    features = pd.DataFrame(
        [[story_points, level_value, team_load_pct]],
        columns=["story_points", "experience_level", "team_load_percentage"],
    )
    return float(time_model.predict(features)[0]), float(risk_model.predict_proba(features)[0][1])


def _task_overhead(task: dict, sprint: dict):
    dependency_count = len(task.get("dependencies", []))
    confidence = max(0, min(100, task.get("confidence", 70)))
    due_days = max(1, int(task.get("due_in_days", 7)))

    hours_multiplier = PRIORITY_WEIGHT.get(task.get("priority", "Medium"), 1.0)
    hours_multiplier *= TYPE_WEIGHT.get(task.get("task_type", "Feature"), 1.0)
    hours_multiplier *= 1 + (dependency_count * 0.05)
    if task.get("must_do"):
        hours_multiplier *= 1.06
    if due_days <= 3:
        hours_multiplier *= 1.12

    coordination_hours = dependency_count * 0.8
    certainty_hours = max(0, 70 - confidence) / 20
    operational_hours = (sprint.get("meeting_hours", 0) + sprint.get("support_hours", 0)) / 8
    extra_hours = coordination_hours + certainty_hours + operational_hours

    risk_delta = dependency_count * 4
    risk_delta += max(0, 75 - confidence) * 0.35
    risk_delta += {"Low": 0, "Medium": 4, "High": 9, "Critical": 15}.get(
        task.get("priority", "Medium"),
        4,
    )
    risk_delta += {"Feature": 4, "Bug": 10, "Chore": 1, "Spike": 14}.get(
        task.get("task_type", "Feature"),
        4,
    )
    if due_days <= 3:
        risk_delta += 12
    if task.get("must_do"):
        risk_delta += 6

    return hours_multiplier, extra_hours, risk_delta


def _member_capacity(member: dict, sprint: dict, allocation_map: dict):
    base_capacity = float(member.get("max_capacity", 40))
    availability_pct = float(member.get("availability_pct", 100)) / 100
    reserved_hours = sprint.get("meeting_hours", 0) + sprint.get("support_hours", 0)
    current_load = float(member.get("current_load", 0))
    planned_load = allocation_map.get(member["name"], 0)
    return max(0.0, (base_capacity * availability_pct) - reserved_hours - current_load - planned_load)


def _fit_score(member: dict, task: dict):
    score = 0
    task_skill = task.get("skill_tag", "")
    assignee_hint = (task.get("assignee_hint") or "").strip().lower()

    if member.get("primary_skill") == task_skill:
        score += 22
    if member.get("secondary_skill") == task_skill:
        score += 10
    if task.get("task_type") == "Bug" and member.get("experience_level") == "Senior":
        score += 8
    if task.get("task_type") == "Spike" and member.get("experience_level") != "Junior":
        score += 6
    if assignee_hint and assignee_hint == member["name"].lower():
        score += 12

    score += {"Junior": 2, "Mid": 5, "Senior": 8}.get(member.get("experience_level"), 5)
    return score


def _task_summary_reason(member: dict, task: dict, remaining_hours: float):
    reasons = []
    if member.get("primary_skill") == task.get("skill_tag"):
        reasons.append(f"primary {task['skill_tag'].lower()} owner")
    elif member.get("secondary_skill") == task.get("skill_tag"):
        reasons.append(f"secondary {task['skill_tag'].lower()} support")

    if task.get("task_type") == "Bug" and member.get("experience_level") == "Senior":
        reasons.append("strong incident experience")
    if remaining_hours > 8:
        reasons.append("healthy capacity buffer")
    if task.get("assignee_hint") and task["assignee_hint"].lower() == member["name"].lower():
        reasons.append("matches preferred owner")

    return reasons or ["best available tradeoff on skill, load, and risk"]


def _candidate_options(task: dict, sprint: dict, team: list[dict], allocation_map: dict):
    options = []
    for member in team:
        base_hours, base_risk = _safe_predict(
            task["story_points"], member["experience_level"], sprint["current_team_load"]
        )
        hours_multiplier, extra_hours, risk_delta = _task_overhead(task, sprint)
        focus_factor = max(0.75, float(member.get("focus_factor", 1.0)))

        predicted_hours = round(((base_hours * hours_multiplier) + extra_hours) / focus_factor, 2)
        risk_pct = min(98.0, max(6.0, (base_risk * 100) + risk_delta - (_fit_score(member, task) * 0.45)))
        capacity_left = _member_capacity(member, sprint, allocation_map)
        fit_score = _fit_score(member, task)
        feasible = capacity_left >= predicted_hours

        options.append(
            {
                "member": member,
                "predicted_hours": predicted_hours,
                "risk_pct": round(risk_pct, 1),
                "capacity_left": round(capacity_left, 2),
                "fit_score": fit_score,
                "feasible": feasible,
                "reasons": _task_summary_reason(member, task, capacity_left),
            }
        )

    return sorted(
        options,
        key=lambda item: (
            not item["feasible"],
            item["risk_pct"] + item["predicted_hours"] - item["fit_score"],
            -item["fit_score"],
        ),
    )


def _dependency_pressure(tasks: list[dict]):
    dependency_map = defaultdict(int)
    for task in tasks:
        for dep in task.get("dependencies", []):
            dependency_map[dep] += 1
    return dependency_map


def _build_task_analysis(task: dict, sprint: dict, team: list[dict], allocation_map: dict):
    options = _candidate_options(task, sprint, team, allocation_map)
    best = options[0]
    backup = options[1] if len(options) > 1 else options[0]

    allocation_map[best["member"]["name"]] += best["predicted_hours"]
    deadline_hours = float(sprint.get("deadline_limit", 40))
    on_time = best["predicted_hours"] <= deadline_hours

    blockers = []
    if len(task.get("dependencies", [])) >= 2:
        blockers.append("Dependency chain is wide enough to slow handoff speed.")
    if best["risk_pct"] >= 60:
        blockers.append("Delivery risk is elevated for the current confidence level.")
    if best["capacity_left"] < best["predicted_hours"]:
        blockers.append("Recommended owner is already close to capacity.")
    if task.get("due_in_days", 10) <= 3:
        blockers.append("Due date pressure is high for this task.")

    return {
        "task_id": int(task["task_id"]),
        "title": task.get("title", f"Task {task['task_id']}"),
        "description": task.get("description", ""),
        "priority": task.get("priority", "Medium"),
        "skill_tag": task.get("skill_tag", "Backend"),
        "task_type": task.get("task_type", "Feature"),
        "story_points": int(task.get("story_points", 1)),
        "dependencies": task.get("dependencies", []),
        "due_in_days": int(task.get("due_in_days", 10)),
        "confidence": int(task.get("confidence", 70)),
        "must_do": bool(task.get("must_do")),
        "predicted_hours": best["predicted_hours"],
        "risk_pct": best["risk_pct"],
        "on_time": on_time,
        "recommended_assignment": {
            "name": best["member"]["name"],
            "experience_level": best["member"]["experience_level"],
            "primary_skill": best["member"]["primary_skill"],
            "remaining_capacity": round(best["capacity_left"] - best["predicted_hours"], 2),
            "why": best["reasons"],
        },
        "backup_assignment": {
            "name": backup["member"]["name"],
            "experience_level": backup["member"]["experience_level"],
            "primary_skill": backup["member"]["primary_skill"],
            "predicted_hours": backup["predicted_hours"],
            "risk_pct": backup["risk_pct"],
        },
        "options": [
            {
                "name": option["member"]["name"],
                "experience_level": option["member"]["experience_level"],
                "primary_skill": option["member"]["primary_skill"],
                "predicted_hours": option["predicted_hours"],
                "risk_pct": option["risk_pct"],
                "capacity_left": option["capacity_left"],
                "fit_score": option["fit_score"],
                "feasible": option["feasible"],
            }
            for option in options[:3]
        ],
        "blockers": blockers,
    }


def _aggregate(team: list[dict], sprint: dict, analyses: list[dict]):
    total_hours = round(sum(task["predicted_hours"] for task in analyses), 2)
    avg_risk = round(
        sum(task["risk_pct"] * task["predicted_hours"] for task in analyses) / max(total_hours, 1),
        1,
    )
    deadline_limit = float(sprint.get("deadline_limit", 40))
    available_capacity = round(
        sum(
            (member.get("max_capacity", 40) * member.get("availability_pct", 100) / 100)
            - sprint.get("meeting_hours", 0)
            - sprint.get("support_hours", 0)
            for member in team
        ),
        2,
    )
    utilization = round((total_hours / max(available_capacity, 1)) * 100, 1)
    on_time_count = sum(1 for task in analyses if task["on_time"])
    critical_tasks = sum(1 for task in analyses if task["priority"] in {"High", "Critical"})

    return {
        "predicted_time": total_hours,
        "risk_score": round(avg_risk, 1),
        "available_capacity": available_capacity,
        "utilization_pct": utilization,
        "on_time_ratio": round((on_time_count / max(len(analyses), 1)) * 100, 1),
        "critical_tasks": critical_tasks,
        "delivery_confidence": max(5, round(100 - avg_risk)),
        "capacity_gap": round(available_capacity - total_hours, 2),
        "deadline_limit": deadline_limit,
    }


def _team_workload(team: list[dict], analyses: list[dict], sprint: dict):
    workload_map = {member["name"]: 0.0 for member in team}
    task_count = Counter()
    risk_load = Counter()

    for task in analyses:
        owner = task["recommended_assignment"]["name"]
        workload_map[owner] += task["predicted_hours"]
        task_count[owner] += 1
        risk_load[owner] += task["risk_pct"]

    rows = []
    for member in team:
        base_capacity = max(
            1.0,
            (member.get("max_capacity", 40) * member.get("availability_pct", 100) / 100)
            - sprint.get("meeting_hours", 0)
            - sprint.get("support_hours", 0),
        )
        committed = float(member.get("current_load", 0)) + workload_map[member["name"]]
        rows.append(
            {
                "name": member["name"],
                "experience_level": member["experience_level"],
                "primary_skill": member["primary_skill"],
                "assigned_hours": round(workload_map[member["name"]], 2),
                "existing_load": float(member.get("current_load", 0)),
                "task_count": int(task_count[member["name"]]),
                "utilization_pct": round((committed / base_capacity) * 100, 1),
                "avg_risk_pct": round(
                    risk_load[member["name"]] / max(task_count[member["name"]], 1),
                    1,
                ),
            }
        )

    return sorted(rows, key=lambda item: item["utilization_pct"], reverse=True)


def _portfolio_breakdown(analyses: list[dict]):
    priority_counter = Counter(task["priority"] for task in analyses)
    skill_counter = Counter(task["skill_tag"] for task in analyses)
    type_counter = Counter(task["task_type"] for task in analyses)

    return {
        "priority_mix": [{"label": key, "value": value} for key, value in priority_counter.items()],
        "skill_mix": [{"label": key, "value": value} for key, value in skill_counter.items()],
        "task_type_mix": [{"label": key, "value": value} for key, value in type_counter.items()],
    }


def _dependency_and_risk_insights(tasks: list[dict], analyses: list[dict], team_rows: list[dict], sprint: dict):
    dependency_map = _dependency_pressure(tasks)
    top_dependency = max(dependency_map.items(), key=lambda item: item[1], default=(None, 0))
    hot_skill = Counter(task["skill_tag"] for task in analyses).most_common(1)
    most_loaded = team_rows[0] if team_rows else None

    recommendations = []
    if most_loaded and most_loaded["utilization_pct"] > 85:
        recommendations.append(
            f"Shift at least one task away from {most_loaded['name']} to reduce overload risk."
        )
    if top_dependency[0] is not None and top_dependency[1] >= 2:
        recommendations.append(
            f"Task {top_dependency[0]} is a dependency bottleneck for {top_dependency[1]} downstream items."
        )
    if sprint.get("support_hours", 0) >= 6:
        recommendations.append("Support load is high enough to protect senior capacity with buffer time.")
    if not recommendations:
        recommendations.append("Current plan is balanced enough to execute without structural changes.")

    return {
        "top_dependency_task_id": top_dependency[0],
        "dependent_task_count": top_dependency[1],
        "hot_skill": hot_skill[0][0] if hot_skill else None,
        "top_risks": [task for task in analyses if task["risk_pct"] >= 60][:5],
        "recommendations": recommendations,
    }


def process_sprint(payload: dict):
    sprint = payload.get("sprint", {})
    sprint.setdefault("sprint_name", "Upcoming Sprint")
    sprint.setdefault("current_team_load", 35.0)
    sprint.setdefault("deadline_limit", 40.0)
    sprint.setdefault("meeting_hours", 4.0)
    sprint.setdefault("support_hours", 2.0)
    sprint.setdefault("risk_tolerance", "Balanced")
    sprint["current_team_load"] = max(40.0, float(sprint["current_team_load"]))

    tasks = payload.get("tasks") or []
    if not tasks:
        return {
            "status": "error",
            "message": "At least one task is required for analysis.",
            "tasks": [],
        }

    team = payload.get("team_members") or fetch_team_members()
    team = [dict(member) for member in team]
    task_list = [dict(task) for task in tasks]
    allocation_map = defaultdict(float)

    ordered_tasks = sorted(
        task_list,
        key=lambda item: (
            item.get("priority") not in {"Critical", "High"},
            not item.get("must_do", False),
            -int(item.get("story_points", 1)),
        ),
    )

    analyses = []
    for task in ordered_tasks:
        task.setdefault("title", f"Task {task['task_id']}")
        task.setdefault("description", "")
        task.setdefault("priority", "Medium")
        task.setdefault("skill_tag", "Backend")
        task.setdefault("task_type", "Feature")
        task.setdefault("dependencies", [])
        task.setdefault("due_in_days", 10)
        task.setdefault("assignee_hint", "")
        task.setdefault("confidence", 70)
        task.setdefault("must_do", False)
        analyses.append(_build_task_analysis(task, sprint, team, allocation_map))

    metrics = _aggregate(team, sprint, analyses)
    team_rows = _team_workload(team, analyses, sprint)
    portfolio = _portfolio_breakdown(analyses)
    insights = _dependency_and_risk_insights(task_list, analyses, team_rows, sprint)

    delivery_status = "On Track"
    if metrics["capacity_gap"] < 0 or metrics["risk_score"] > 60:
        delivery_status = "At Risk"
    elif metrics["utilization_pct"] > 82:
        delivery_status = "Watch"

    summary = {
        "sprint_name": sprint["sprint_name"],
        "delivery_status": delivery_status,
        "metrics": metrics,
        "team_workload": team_rows,
        "portfolio": portfolio,
        "insights": insights,
        "tasks": analyses,
    }

    snapshot_id = save_snapshot(sprint["sprint_name"], summary)

    return {
        "status": "success",
        "predicted_time": metrics["predicted_time"],
        "risk_score": metrics["risk_score"],
        "delivery_status": delivery_status,
        "metrics": metrics,
        "team_workload": team_rows,
        "portfolio": portfolio,
        "insights": insights,
        "tasks": analyses,
        "snapshot_id": snapshot_id,
    }


def create_assignment_plan(payload: dict):
    analysis = process_sprint(payload)
    if analysis.get("status") != "success":
        return analysis

    assignments = []
    for task in analysis["tasks"]:
        assignments.append(
            {
                "task_id": task["task_id"],
                "title": task["title"],
                "assigned_to": task["recommended_assignment"]["name"],
                "experience_level": task["recommended_assignment"]["experience_level"],
                "predicted_hours": task["predicted_hours"],
                "risk_pct": task["risk_pct"],
                "backup_owner": task["backup_assignment"]["name"],
            }
        )

    response = deepcopy(analysis)
    response["assignments"] = assignments
    return response
