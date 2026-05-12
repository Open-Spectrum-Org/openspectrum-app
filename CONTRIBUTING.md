# Contributing to OpenSpectrum

Thank you for your interest in contributing. OpenSpectrum is built by and for families navigating neurodiversity — every contribution matters, whether it's code, design, documentation, or sharing your experience.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Ways to Contribute](#ways-to-contribute)
3. [Development Setup](#development-setup)
4. [Picking Up an Issue](#picking-up-an-issue)
5. [Branch Naming](#branch-naming)
6. [Pull Request Process](#pull-request-process)
7. [Commit Style](#commit-style)
8. [Questions?](#questions)

---

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before participating.

---

## Ways to Contribute

You don't need to write code to contribute:

- **Report a bug** — use the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md)
- **Suggest a feature** — use the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md)
- **Improve documentation** — fix typos, clarify explanations, add examples
- **Design** — wireframes, icons, UX feedback
- **Share lived experience** — open a Discussion to share what would help your family
- **Translate** — help make OpenSpectrum accessible in other languages
- **Test** — try the app and report what you find

---

## Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Git

### Steps

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/openspectrum-app.git
cd openspectrum-app

# 3. Start the full stack
docker-compose up

# 4. Verify it's running
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs
```

The Docker setup handles all dependencies — no local Python or Node installation required.

### Without Docker

If you prefer running services directly:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Picking Up an Issue

1. Browse [open issues](https://github.com/OpenSpectrum/openspectrum-app/issues)
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on the issue to let others know you're working on it
4. If you have questions, ask in the issue thread or on Discord

**Please don't open a PR for an issue that isn't assigned or claimed** — coordinate first to avoid duplicate work.

---

## Branch Naming

Use this convention:

| Type | Pattern | Example |
|---|---|---|
| New feature | `feat/short-description` | `feat/voice-input-button` |
| Bug fix | `fix/short-description` | `fix/timeline-date-filter` |
| Documentation | `docs/short-description` | `docs/quickstart-guide` |
| Chore / tooling | `chore/short-description` | `chore/update-docker-deps` |

Always branch from `main`.

---

## Pull Request Process

1. **Fork** the repo and create your branch from `main`
2. **Write** your changes — keep PRs focused and small
3. **Test** your changes locally with `docker-compose up`
4. **Fill out** the PR template when you open the pull request
5. **Wait** for a review — we aim to respond within a few days

### PR Requirements
- All existing tests pass (once we have a test suite)
- No new linting errors
- PR description explains *what* changed and *why*
- Screenshots for any UI changes

---

## Commit Style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add voice input button to quick log screen
fix: correct timezone handling in timeline view
docs: update quickstart instructions for Windows
chore: upgrade FastAPI to 0.110
```

Keep messages concise. Use the body for context if needed.

---

## Privacy Guideline

OpenSpectrum handles sensitive health data about children. When contributing:

- **Never log PII** (names, dates of birth, etc.) in error messages or console output
- **Never add telemetry or tracking** without explicit opt-in design approved by maintainers
- **Review the [Privacy Design doc](https://github.com/OpenSpectrum/openspectrum-docs/blob/main/architecture/privacy-design.md)** before building any data-handling feature

---

## Questions?

- Open a [question issue](./.github/ISSUE_TEMPLATE/question.md)
- Join our [Discord community](#) *(link coming soon)*
- Start a [GitHub Discussion](https://github.com/OpenSpectrum/openspectrum-docs/discussions)
