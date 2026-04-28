# OptiSprint AI – Sprint Planner

A full-stack AI-powered sprint planning tool for agile teams. Combines a FastAPI backend (Python), React frontend, and machine learning models for smart task assignment, risk analysis, and sprint analytics.

---

## Features

- **AI Task Assignment:** Automatically assigns tasks to developers based on skill, workload, and risk.
- **Sprint Analytics:** Visualizes workload distribution and team utilization.
- **Risk Prediction:** Estimates risk of task failure using historical data.
- **Modern UI:** Built with React, Tailwind CSS, and Vite.
- **Dockerized:** Easy deployment with Docker and Docker Compose.

---

## Project Structure

```
Sprint_PLanner/
├── Backend/                # FastAPI backend (main API server)
│   └── main.py
├── frontend/               # React frontend (Vite)
│   └── src/
├── train_brain/            # AI/ML logic (model training, inference)
│   ├── train_brain.py
│   ├── auto_assigner.py
│   ├── use_ai.py
│   └── sprint_report.py
├── requirements.txt        # Python dependencies
├── dockerfile              # Backend Dockerfile
├── docker-compose.yml      # Multi-service orchestration
├── rules.txt               # Assignment rules/heuristics
└── README.md               # Project documentation
```

---

## Backend (FastAPI)

- **Location:** `Backend/`
- **Main entry:** `main.py`
- **Endpoints:**
  - `/api/predict-sprint` – Predicts time and risk for a set of tasks
  - `/api/auto-assign` – Runs the auto-assignment algorithm
  - `/api/sprint-report` – Generates and returns sprint analytics
- **ML Integration:** Uses models from `train_brain/` (see below)
- **Database:** Connects to MySQL (see `.env` and Docker Compose)

---

## AI/ML Engine (`train_brain/`)

- **Model Training:** `train_brain.py` (trains time and risk models)
- **Inference:** `use_ai.py` (loads models, exposes prediction functions)
- **Auto Assignment:** `auto_assigner.py` (greedy assignment logic)
- **Sprint Analytics:** `sprint_report.py` (generates workload charts)
- **Models:** `time_model.pkl`, `risk_model.pkl` (saved in project root)

---

## Frontend (React + Vite)

- **Location:** `frontend/`
- **Main entry:** `src/App.jsx`
- **Pages:**
  - Dashboard: Sprint analytics and workload chart
  - Task Input: Enter tasks, get AI predictions
- **Proxy:** API requests proxied to backend via Vite config
- **UI:** Tailwind CSS, Lucide icons

---

## Setup & Usage

### 1. Prerequisites
- Docker & Docker Compose
- (Or) Python 3.10+, Node.js 18+, MySQL 8 (manual setup)

### 2. Environment Variables
Create a `.env` file in the root with:
```
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=db
DB_NAME=smart_planner
MYSQL_ROOT_PASSWORD=yourpassword
```

### 3. Run with Docker Compose
```sh
docker-compose up --build
```
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- MySQL: localhost:3307

### 4. Manual Development
- **Backend:**
  ```sh
  cd Sprint_PLanner
  pip install -r requirements.txt
  uvicorn Backend.main:app --reload
  ```
- **Frontend:**
  ```sh
  cd frontend
  npm install
  npm run dev
  ```

---

## Assignment Rules
See `rules.txt` for the logic behind task assignment and risk heuristics.

---

## License
MIT License. See LICENSE file.

---

## Authors
- [Your Name Here]

---

## Acknowledgements
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
