# OpenSpectrum Backend

Python + FastAPI + SQLAlchemy + SQLite

## Status

**Not yet scaffolded.** This directory is a placeholder.

## Planned Setup

```bash
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy
uvicorn main:app --reload
```

## Planned Structure

```
backend/
├── main.py              # FastAPI app and routes
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic request/response schemas
├── database.py          # DB connection and session management
├── requirements.txt     # Python dependencies
├── Dockerfile
└── config/
    └── settings.py      # Environment-based configuration
```

## API Endpoints (MVP)

| Method | Path | Description |
|---|---|---|
| POST | `/events` | Log a new event |
| GET | `/events` | Retrieve events (filterable) |
| GET | `/children` | List child profiles |
| POST | `/children` | Create a child profile |
| GET | `/insights/correlations` | Basic correlation data |
| GET | `/export` | Export data as CSV |

Full API design: [openspectrum-docs/architecture/api-design.md](https://github.com/OpenSpectrum/openspectrum-docs/blob/main/architecture/api-design.md)

## Getting Started

Use Docker Compose from the repo root for the full dev stack:

```bash
docker-compose up
```

API docs are auto-generated at http://localhost:8000/docs when the server is running.

---

*Architecture decisions are documented in [openspectrum-docs](https://github.com/OpenSpectrum/openspectrum-docs).*
