# ICT Infrastructure Incident Tracker

Enterprise-style MERN application for managing ICT incidents, outages, service disruptions, and operational workflows.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Recharts
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Auth: JWT with RBAC
- State: Context API
- Deployment: Docker, docker-compose

## Project Structure

- `server/` - Express API, MongoDB models, controllers, middleware, seed script
- `client/` - React dashboard, auth, incident workflows, charts, tables
- `docker-compose.yml` - App + MongoDB orchestration

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   ```bash
   npm install
   npm install --workspace server
   npm install --workspace client
   ```
3. Start development:
   ```bash
   npm run dev
   ```

## Seed Data

Seed the database with demo users and incidents:

```bash
npm run seed
```

Default demo users:

- Admin: `admin@ict.local` / `Admin123!`
- Engineer: `engineer@ict.local` / `Engineer123!`
- Viewer: `viewer@ict.local` / `Viewer123!`

## API

See `docs/API.md` for endpoint documentation.

## Docker

```bash
docker-compose up --build
```

The public entrypoint is the Nginx container on `http://localhost`.
The backend CORS allowlist is controlled by the comma-separated `CLIENT_URL` value in `.env`.

By default, attachments are stored in the `./upload` bind mount and served locally from `/uploads`.
To enable S3-compatible storage, set `ATTACHMENT_STORAGE=s3` and start the stack with the `s3` profile:

```bash
ATTACHMENT_STORAGE=s3 docker-compose --profile s3 up --build
```

## Notes

- Attachments are modeled as placeholders for storage integration.
- Email notifications and PDF generation are implemented as backend-ready service hooks.
- WebSocket support is wired for live incident updates when enabled.
