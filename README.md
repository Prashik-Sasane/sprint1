# OptiSprint AI

OptiSprint is a sprint planning workspace built with FastAPI, React, and lightweight ML heuristics. It now behaves more like a real planning tool than a UI demo: you can model backlog detail, team capacity, task dependencies, owner hints, and delivery risk in one flow.

## What Changed

- Rich sprint planning inputs instead of only `story_points`
- Editable team capacity model with availability, focus, and current load
- Structured task analysis with recommended owner, backup owner, blockers, and risk
- Interactive dashboard for workload, portfolio mix, dependency pressure, and planning history
- Safer backend fallback behavior when MySQL is unavailable
- Better runtime schema support for richer sprint records and saved snapshots

## Project Structure

```text
Backend/                 FastAPI API
frontend/                React + Vite frontend
train_brain/             Planning logic, assignment logic, seed/training scripts
time_model.pkl           Time estimation model
risk_model.pkl           Risk prediction model
docker-compose.yml       MySQL + API services
dockerfile               API container build
```

## API Endpoints

- `GET /api/reference-data`
  Returns seeded backlog items, team members, and recent snapshots.
- `POST /api/predict-sprint`
  Runs the planner and returns sprint metrics, task recommendations, workload, and insights.
- `POST /api/auto-assign`
  Produces and optionally persists assignment output.
- `GET /api/sprint-report`
  Returns the latest saved analytics and assignment summary.

## Frontend Flow

- `/`
  Landing page
- `/planner`
  Sprint configuration, team setup, and backlog editing
- `/dashboard`
  Delivery confidence, workload, risk, and task-level recommendations

## Run Locally

### Backend

Create a virtual environment and install Python dependencies:

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Start the API:

```bash
.venv/bin/python -m uvicorn Backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API on `http://127.0.0.1:8000`.

## Database

The app works without MySQL by falling back to built-in sample team and backlog data. If you want persistence and seeded planning history, start the database first and run:

```bash
python -m train_brain.seed_data
```

### Docker / Podman Compose

You can use Docker Compose or Podman Compose with the existing `docker-compose.yml`:

```bash
docker compose up --build
```

or

```bash
podman compose up --build
```

## Verification

These checks passed for the current code:

- `python -m compileall -q train_brain Backend`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

I also smoke-tested the planner logic directly through the Python modules using fallback data, including prediction, assignment, and report generation.
