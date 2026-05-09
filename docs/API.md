# API Documentation

Base URL: `/api`

## Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Incidents

- `GET /incidents`
- `POST /incidents`
- `GET /incidents/:id`
- `PATCH /incidents/:id`
- `DELETE /incidents/:id`
- `POST /incidents/:id/comments`
- `GET /incidents/:id/activity`
- `GET /incidents/report`
- `GET /incidents/:id/report`
- `GET /incidents/export/csv`

## Reports

- `GET /reports` - UI route for export actions and report summary

## Dashboard

- `GET /dashboard/summary`

## Users

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `GET /users/profile/me`
- `PATCH /users/profile/me`

## Common Query Params

- `page`
- `limit`
- `sort`
- `search`
- `status`
- `priority`
- `category`
- `assignedEngineer`
- `from`
- `to`

## Notes

- All protected routes require `Authorization: Bearer <token>`.
- Admin-only routes are enforced by RBAC middleware.
