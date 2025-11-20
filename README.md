# StyleGenie
## Live Demo: https://style-genie-frontend.vercel.app

AI-assisted personal styling platform that combines a Django REST API with a modern React/Vite frontend. It digitizes a client’s wardrobe, applies AI-driven outfit guidance, and connects clients with expert stylists for bookings, chat, and paid sessions.

## Highlights
- Personalized onboarding captures body metrics, tone, and style goals for each account.
- Wardrobe digitization workflow with Cloudinary uploads, tagging, and editing from the dashboard.
- AI recommendation screens that surface saved looks, generation progress, and stylist suggestions.
- Dual-role authentication (client + stylist) backed by JWT, custom user model, and DRF viewsets.
- Operational tooling: health checks, OpenAPI docs, Celery wiring, plus a Documentation hub that points to Figma, Notion, and pitch resources.

## Tech Stack
| Layer | Details |
| --- | --- |
| Frontend | React 18 + TypeScript, Vite, Tailwind/shadcn-ui, Radix primitives, React Query, React Hook Form, Zod |
| Backend | Django 4.2, Django REST Framework, Simple JWT, custom `User`, Celery, Redis, PostgreSQL |
| Storage/Infra | Cloudinary for wardrobe media, Docker/Docker Compose for local orchestration, Railway/Vercel friendly |

## Repository Layout
```
.
├── backend/          # Django project (accounts, client, stylist, recommendations, etc.)
├── frontend/         # Vite React SPA
├── .gitignore
└── README.md         # You're here
```

## Getting Started

### Prerequisites
- Python 3.10+ (matches the Docker image) and pip
- Node.js 18+ (LTS recommended) and npm
- Redis (for Celery/async jobs) & PostgreSQL if running the full stack locally
- Docker + docker-compose (optional but handy)

### 1. Clone & bootstrap
```bash
git clone <your_fork_url> style_genie
cd style_genie
```

### 2. Backend (Django + DRF)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # or Scripts\\activate on Windows
pip install -r requirements.txt
```

Create `backend/.env` (or reuse the checked-in one) and update it for your environment:
```ini
SECRET_KEY=change-me
DJANGO_SETTINGS_MODULE=core.settings.dev
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=postgres
DB_NAME=stylegenie
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432

# Async workers
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS / CSRF
CSRF_TRUSTED_ORIGINS=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
CORS_ALLOW_ALL_ORIGINS=True
```

Run the usual Django workflow:
```bash
python manage.py migrate
python manage.py createsuperuser   # optional
python manage.py runserver 0.0.0.0:8000
```

Optional services:
```bash
# Celery worker for async jobs (generation queues, notifications, etc.)
celery -A core worker --loglevel=info
```

Health check and docs:
- `http://localhost:8000/health/` – DB + app status
- `http://localhost:8000/api/docs/` or `/api/redoc/` – auto-generated Swagger/ReDoc (drf-spectacular)

#### Dockerized backend
```bash
cd backend
docker-compose up --build
```
The compose file launches `django_app` and `postgres_service`, runs migrations, and exposes the API on `localhost:8000`.

### 3. Frontend (Vite + React)

```bash
cd frontend
npm install
```

Create `frontend/.env` to point the SPA at your backend and media provider:
```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_CLOUDINARY_CLOUD_NAME=<your-cloud>
VITE_CLOUDINARY_UPLOAD_PRESET=<unsigned-upload-preset>

# Optional: docs & staging links displayed on /documentation
VITE_SYSTEM_DESIGN_URL=https://...
VITE_FIGMA_FILE_URL=https://...
VITE_PITCH_DECK_URL=https://...
VITE_PRODUCT_REQUIREMENTS_URL=https://...
VITE_STAGING_CLIENT_EMAIL=demo@example.com
VITE_STAGING_CLIENT_PASSWORD=SafePass123
VITE_STAGING_STYLIST_EMAIL=stylist@example.com
VITE_STAGING_STYLIST_PASSWORD=SafePass123
```

Start the dev server:
```bash
npm run dev
```
Vite listens on `http://localhost:5173` by default.

### 4. Running the full stack

```
# Terminal 1
cd backend && source .venv/bin/activate && python manage.py runserver

# Terminal 2
cd frontend && npm run dev
```

Visit `http://localhost:5173` for the SPA. It proxies API calls to `VITE_API_BASE_URL`.

## Core Features
- **Onboarding & Auth** – Dual-role registration/login/reset flows for clients and stylists using JWT (SimpleJWT) and a custom user model (`accounts.User`).
- **Client Dashboard** – Update style profile (gender, body/face shape, tones), review insights, and edit account security from `frontend/src/pages/Dashboard.tsx`.
- **Wardrobe Library** – Upload garments to Cloudinary, tag categories/colors, and CRUD them via `/client/wardrobe/` endpoints.
- **Stylists Marketplace** – Browse curated stylists, review expertise/availability, and initiate bookings from `frontend/src/pages/Stylists.tsx`.
- **AI Recommendations** – `frontend/src/pages/Recommendations.tsx` surfaces generated outfits, saves looks locally, and shows pipeline progress UI.
- **Operational Docs** – `/documentation` centralizes links to the system design, Figma kit, pitch deck, and demo credentials powered by Vite env vars.

## API surface (selected)
| Area | Endpoint | Notes |
| --- | --- | --- |
| Health | `GET /health/` | DB + environment heartbeat |
| Auth (client) | `POST /client/auth/register/`, `POST /client/auth/login/`, `POST /client/auth/logout/`, `POST /client/auth/token/refresh/` | Email/password with JWT |
| Client profile | `GET/PATCH /client/me/` | Style profile management |
| Passwords (client) | `/client/auth/change-password/`, `/client/auth/send-reset-password-email/`, `/client/auth/reset-password/<uidb64>/<token>/` | |
| Wardrobe | `GET/POST /client/wardrobe/` and `GET/PATCH/DELETE /client/wardrobe/{id}/` | Managed via DRF viewset |
| Stylist directory | `GET /client/stylists/` | Public browse API |
| Auth (stylist) | `/stylist/auth/*` parity with client routes | |
| Stylist profile | `GET/PATCH /stylist/me/` | Update bio, expertise, and years of experience |
| Documentation | `GET /api/schema/`, `/api/docs/`, `/api/redoc/` | OpenAPI sources |

Extend the API by adding apps (e.g., `appointments`, `payments`, `recommendations`) and registering routes in `backend/core/urls.py`.

## Environment variable reference
| Scope | Key | Purpose |
| --- | --- | --- |
| Backend | `DJANGO_SETTINGS_MODULE` | Switch between `core.settings.dev/prod/test` |
| Backend | `DB_*` | PostgreSQL credentials or override with SQLite if needed |
| Backend | `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | Redis endpoints for async tasks |
| Backend | `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` | Frontend + deployment safety |
| Frontend | `VITE_API_BASE_URL` | Base URL for all `fetch`/React Query requests |
| Frontend | `VITE_CLOUDINARY_*` | Controls uploads from the Wardrobe dialog |
| Frontend | `VITE_SYSTEM_DESIGN_URL`, `VITE_FIGMA_FILE_URL`, `VITE_PITCH_DECK_URL`, `VITE_PRODUCT_REQUIREMENTS_URL` | Populates the in-app documentation hub |
| Frontend | `VITE_STAGING_*` | Optional demo credentials shown on `/documentation` |

## Useful commands
| Area | Command | Description |
| --- | --- | --- |
| Backend | `python manage.py migrate` | Apply database migrations |
| Backend | `python manage.py createsuperuser` | Admin login for `/admin/` |
| Backend | `python manage.py test` | Run Django test suite |
| Backend | `celery -A core worker -l info` | Launch Celery worker |
| Frontend | `npm run dev` | Start Vite dev server |
| Frontend | `npm run build` | Production bundle into `dist/` |
| Frontend | `npm run preview` | Serve the production build locally |
| Frontend | `npm run lint` | ESLint (TypeScript + React hooks rules) |

## Deployment notes
- **Backend**: container-friendly via `backend/Dockerfile` (`python:3.9-slim`). Run `gunicorn core.wsgi --bind 0.0.0.0:$PORT` on platforms like Railway or Render.
- **Frontend**: `npm run build` emits a static `dist/` folder ready for Vercel, Netlify, S3/CloudFront, etc. Ensure environment vars (API base URL, doc links) are injected at build time.
- **Assets**: Wardrobe uploads rely on unsigned Cloudinary presets—lock them down or move to signed uploads before production.

## Contributing
1. Fork the repo & create a feature branch.
2. Update or add tests/docs relevant to your change.
3. Run `python manage.py test`, `npm run lint`, and `npm run build`.
4. Open a PR describing motivation, screenshots (if UI), and how to QA.

## License
Released under the MIT License. Add a dedicated `LICENSE` file before distributing widely.

