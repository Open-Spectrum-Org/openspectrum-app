# Quickstart Guide

Get OpenSpectrum running locally in minutes.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Git](https://git-scm.com/)

That's it. No Python, Node, or other runtimes needed.

---

## Steps

### 1. Clone the repository

```bash
git clone https://github.com/OpenSpectrum/openspectrum-app.git
cd openspectrum-app
```

### 2. Start the stack

```bash
docker-compose up
```

Docker will pull/build the images and start both services. First run takes a few minutes while images are built.

### 3. Open the app

| Service | URL |
|---|---|
| App (frontend) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API documentation | http://localhost:8000/docs |

### 4. Stop the stack

```bash
# Stop (keep data)
docker-compose stop

# Stop and remove containers (keep data volume)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

---

## Your data

Data is stored in a Docker volume named `openspectrum-data`. It persists between restarts unless you run `docker-compose down -v`.

The SQLite database file lives at `/app/data/openspectrum.db` inside the backend container.

---

## Troubleshooting

**Port already in use:**
```bash
# Check what's using port 8000
lsof -i :8000
# Or change the port in docker-compose.yml
```

**Container won't start:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Reset everything:**
```bash
docker-compose down -v
docker-compose up --build
```

---

## Next steps

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) to start contributing
- Browse [open issues](https://github.com/OpenSpectrum/openspectrum-app/issues) for ways to help
- Join our [Discord community](#) for questions and discussion
