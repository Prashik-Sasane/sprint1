import random

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import text

from train_brain.runtime import engine, ensure_runtime_schema, SKILL_OPTIONS


load_dotenv()

LEVELS = ["Junior", "Mid", "Senior"]
TASK_TYPES = ["Feature", "Bug", "Chore", "Spike"]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
KANBAN_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"]

TEAM_BLUEPRINT = [
    ("Ava Patel", "Senior", "Backend", "Database", 11.0, 40.0, 90.0, 1.15),
    ("Noah Kim", "Senior", "Frontend", "UI/UX", 9.0, 40.0, 95.0, 1.08),
    ("Mia Chen", "Mid", "API", "Backend", 8.0, 40.0, 100.0, 1.00),
    ("Leo Martinez", "Mid", "DevOps", "Security", 6.5, 40.0, 90.0, 0.96),
    ("Ivy Johnson", "Junior", "Frontend", "Mobile", 4.0, 35.0, 100.0, 0.92),
    ("Ethan Rao", "Junior", "Backend", "API", 5.0, 35.0, 100.0, 0.90),
    ("Sara Ali", "Mid", "Database", "Backend", 7.0, 40.0, 85.0, 0.98),
    ("Owen Brooks", "Senior", "Security", "DevOps", 10.0, 40.0, 85.0, 1.05),
]

TASK_BLUEPRINT = [
    ("Checkout retry hardening", "Stabilize payment retries and webhook reconciliation.", 5, "High", "Backend", "Bug", [], 4, "Ava Patel", 58, True, "Review"),
    ("Dashboard redesign", "Refresh sprint summary cards and analytics hierarchy.", 8, "Medium", "Frontend", "Feature", [1], 8, "Noah Kim", 72, True, "In Progress"),
    ("CI pipeline cleanup", "Reduce flaky pipeline steps and tighten caching.", 3, "Medium", "DevOps", "Chore", [], 10, "Leo Martinez", 80, False, "Backlog"),
    ("OAuth login flow", "Add Google and GitHub sign-in to onboarding.", 8, "High", "Backend", "Feature", [], 6, "Ava Patel", 62, True, "To Do"),
    ("Mobile layout fixes", "Repair overflow issues on tablet and mobile breakpoints.", 3, "Low", "Frontend", "Bug", [2], 12, "Ivy Johnson", 86, False, "Backlog"),
    ("API rate limiting", "Protect critical endpoints with tenant-aware throttling.", 5, "Medium", "API", "Feature", [4], 9, "Mia Chen", 74, False, "To Do"),
    ("Query index tuning", "Profile slow sprint queries and add missing indexes.", 3, "Medium", "Database", "Chore", [], 14, "Sara Ali", 78, False, "Done"),
    ("Security audit remediation", "Address the latest penetration test findings.", 8, "Critical", "Security", "Bug", [4, 6], 5, "Owen Brooks", 44, True, "To Do"),
    ("Release checklist automation", "Generate deployment checklist from board state.", 2, "Low", "DevOps", "Feature", [3], 11, "Leo Martinez", 82, False, "Backlog"),
    ("Team velocity report", "Add sprint-over-sprint velocity comparison widgets.", 5, "Medium", "Frontend", "Feature", [2], 10, "Noah Kim", 70, False, "Review"),
    ("Support rotation notes", "Document recurring incident patterns and triage actions.", 1, "Low", "Security", "Chore", [], 7, "Owen Brooks", 88, False, "Done"),
    ("Schema migration prep", "Prepare sprint data schema for future roadmap items.", 3, "Medium", "Database", "Spike", [], 9, "Sara Ali", 69, False, "In Progress"),
    ("Bug bash follow-up", "Convert QA findings into tracked defects and fixes.", 2, "Medium", "Frontend", "Bug", [], 6, "Ivy Johnson", 76, False, "To Do"),
    ("Observability alerts", "Tune noisy alerts and add missing ownership tags.", 3, "Medium", "DevOps", "Feature", [], 8, "Leo Martinez", 73, False, "Backlog"),
    ("Permissions matrix review", "Review role access before admin settings launch.", 5, "High", "Security", "Spike", [8], 7, "Owen Brooks", 52, True, "Backlog"),
    ("Backlog grooming notes", "Summarize carry-over work for the next sprint.", 1, "Low", "API", "Chore", [], 13, "Mia Chen", 90, False, "Done"),
]


def create_developers():
    developers = []
    for dev_id, blueprint in enumerate(TEAM_BLUEPRINT, start=1):
        name, experience_level, primary_skill, secondary_skill, current_load, max_capacity, availability_pct, focus_factor = blueprint
        developers.append(
            {
                "dev_id": dev_id,
                "name": name,
                "experience_level": experience_level,
                "primary_skill": primary_skill,
                "secondary_skill": secondary_skill,
                "current_load": current_load,
                "max_capacity": max_capacity,
                "availability_pct": availability_pct,
                "focus_factor": focus_factor,
            }
        )
    return pd.DataFrame(developers)


def create_sprint_context():
    rows = []
    for sprint_id in range(1, 161):
        rows.append(
            {
                "sprint_id": sprint_id,
                "team_load_percentage": random.choice([70, 80, 90, 100, 110]),
                "is_holiday_season": 1 if sprint_id % 12 == 0 else 0,
            }
        )
    return pd.DataFrame(rows)


def create_historical_tasks(developers, sprint_context):
    history = []
    for task_id in range(1, 2501):
        developer = developers.sample().iloc[0]
        sprint = sprint_context.sample().iloc[0]
        story_points = random.choice([1, 2, 3, 5, 8])
        task_type = random.choice(TASK_TYPES)

        multiplier = {"Junior": 1.8, "Mid": 1.3, "Senior": 0.95}[developer["experience_level"]]
        multiplier *= 1 + max(0, sprint["team_load_percentage"] - 100) / 250
        multiplier *= {"Feature": 1.0, "Bug": 1.08, "Chore": 0.82, "Spike": 1.15}[task_type]
        actual_hours = (story_points * 7.5 * multiplier) + random.uniform(-1.5, 2.5)
        expected_hours = story_points * 7
        is_failed = 1 if actual_hours > expected_hours * 1.22 else 0

        history.append(
            {
                "task_id": task_id,
                "dev_id": int(developer["dev_id"]),
                "sprint_id": int(sprint["sprint_id"]),
                "category": developer["primary_skill"],
                "story_points": story_points,
                "actual_hours": round(actual_hours, 2),
                "is_failed": is_failed,
            }
        )
    return pd.DataFrame(history)


def create_backlog():
    backlog = []
    for task_id, blueprint in enumerate(TASK_BLUEPRINT, start=1):
        title, description, story_points, priority, skill_tag, task_type, dependencies, due_in_days, assignee_hint, confidence, must_do, status = blueprint
        predicted_hours = round(story_points * random.uniform(4.8, 7.2), 2)
        risk_score = round(random.uniform(12, 58), 1)
        backlog.append(
            {
                "task_id": task_id,
                "sprint_id": 1 if task_id <= 12 else 2,
                "title": title,
                "description": description,
                "story_points": story_points,
                "priority": priority,
                "status": status,
                "skill_tag": skill_tag,
                "task_type": task_type,
                "dependencies": ",".join(str(dep) for dep in dependencies),
                "due_in_days": due_in_days,
                "assignee_hint": assignee_hint,
                "confidence": confidence,
                "must_do": 1 if must_do else 0,
                "assigned_to": assignee_hint if status != "Backlog" else "",
                "predicted_hours": predicted_hours if status != "Backlog" else 0.0,
                "risk_score": risk_score if status != "Backlog" else 0.0,
            }
        )
    return pd.DataFrame(backlog)


def create_sprints():
    return pd.DataFrame(
        [
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
    )


def create_activity_log():
    return pd.DataFrame(
        [
            {
                "type": "sprint_created",
                "message": "Sprint 24 — Foundation was created",
                "actor": "System",
            },
            {
                "type": "task_created",
                "message": "Security audit remediation added to backlog",
                "actor": "System",
            },
            {
                "type": "member_added",
                "message": "Developer_1 joined the team",
                "actor": "System",
            },
        ]
    )


def main():
    if engine is None:
      print("Database engine is not configured.")
      return

    ensure_runtime_schema()

    developers = create_developers()
    sprint_context = create_sprint_context()
    historical_tasks = create_historical_tasks(developers, sprint_context)
    backlog = create_backlog()
    sprints = create_sprints()
    activity = create_activity_log()

    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        conn.execute(text("DROP TABLE IF EXISTS historical_tasks"))
        conn.execute(text("DROP TABLE IF EXISTS sprint_context"))
        conn.execute(text("DELETE FROM activity_log"))
        conn.execute(text("DELETE FROM sprints"))
        conn.execute(text("DELETE FROM sprint_snapshots"))
        conn.execute(text("DELETE FROM sprint_table"))
        conn.execute(text("DELETE FROM developers"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS sprint_context (
                    sprint_id INT NOT NULL,
                    team_load_percentage INT,
                    is_holiday_season BOOLEAN,
                    PRIMARY KEY (sprint_id)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS historical_tasks (
                    task_id INT NOT NULL,
                    dev_id INT NOT NULL,
                    sprint_id INT NOT NULL,
                    category VARCHAR(50),
                    story_points INT,
                    actual_hours FLOAT,
                    is_failed BOOLEAN,
                    PRIMARY KEY (task_id)
                )
                """
            )
        )

    developers.to_sql("developers", con=engine, if_exists="append", index=False)
    sprint_context.to_sql("sprint_context", con=engine, if_exists="append", index=False)
    historical_tasks.to_sql("historical_tasks", con=engine, if_exists="append", index=False)
    sprints.to_sql("sprints", con=engine, if_exists="append", index=False)
    backlog.to_sql("sprint_table", con=engine, if_exists="append", index=False)
    activity.to_sql("activity_log", con=engine, if_exists="append", index=False)
    print("Seed data created for developers, historical tasks, sprints, activity, and the active backlog.")


if __name__ == "__main__":
    main()
