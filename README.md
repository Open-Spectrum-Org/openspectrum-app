# OpenSpectrum

**A privacy-first, open-source platform for parents of neurodivergent children to track daily observations and surface meaningful insights.**

> Track. Understand. Advocate.

---

## What is OpenSpectrum?

OpenSpectrum helps families log daily events — food, medication, behavior, milestones — and discover patterns that support better care decisions. All data stays on your device by default. No cloud. No tracking. No accounts required.

### Core Principles
- **Privacy first**: Local storage by default, you own your data
- **Open source**: Built by the community, for the community
- **Low friction**: Log an event in under 30 seconds
- **Accessible**: Works in any browser, no app store required

---

## Quick Start (Development)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Run locally
```bash
git clone https://github.com/OpenSpectrum/openspectrum-app.git
cd openspectrum-app
docker-compose up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

For a detailed setup guide, see [QUICKSTART.md](./QUICKSTART.md).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript (PWA) |
| Backend | Python + FastAPI |
| Database | SQLite (via SQLAlchemy) |
| Voice Input | Web Speech API |
| Dev Environment | Docker + Docker Compose |

---

## Project Structure

```
openspectrum-app/
├── frontend/          # React + Vite + TypeScript PWA
├── backend/           # Python FastAPI application
├── docker-compose.yml # One-command dev environment
├── CONTRIBUTING.md    # How to contribute
└── CODE_OF_CONDUCT.md # Community standards
```

---

## MVP Features

- [ ] Child profile management
- [ ] Quick event logging (Food / Medication / Behavior)
- [ ] Voice-to-text input (Web Speech API)
- [ ] Timeline view (chronological, filterable)
- [ ] Basic charts (events per day, category breakdown)
- [ ] CSV data export
- [ ] Local-first SQLite storage

---

## Contributing

We welcome contributions of all kinds — code, design, documentation, testing, and lived experience.

Read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started. For questions, join our [Discord community](#) or open a [Discussion](https://github.com/OpenSpectrum/openspectrum-docs/discussions).

**Good first issues are labeled [`good first issue`](https://github.com/OpenSpectrum/openspectrum-app/labels/good%20first%20issue) on GitHub.**

---

## Documentation

Full architecture, API design, and privacy documentation lives in the [openspectrum-docs](https://github.com/OpenSpectrum/openspectrum-docs) repository.

---

## License

[MIT License](./LICENSE) — free to use, modify, and distribute.

---

## Community

- GitHub Discussions: [openspectrum-docs](https://github.com/OpenSpectrum/openspectrum-docs/discussions)
- Discord: [Join our server](#) *(link coming soon)*

---

*Built with care for families navigating neurodiversity.*
