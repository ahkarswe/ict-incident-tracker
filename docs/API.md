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
- `GET /incidents/report` - JSON data for the all-incidents printable report view
- `GET /incidents/:id/report` - JSON data for the single-incident printable report view
- `GET /incidents/export/csv`

## Reports

- `GET /reports` - UI route for report summary and print actions
- `GET /reports/print` - printable all-incidents report view
- `GET /incidents/:id/print` - printable single-incident report view

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
