# Team Jersey Order

Collect football jersey details from your team with **first-come-first-served** number selection.

## Features

- Login via OTP sent to **@dcluttr.ai** email addresses only
- One player registration per email
- Jersey numbers 1–99, claimed on a first-come-first-served basis
- Live roster so the team can see what's taken
- Admin CSV export

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**. The API runs on port **3001**.

Without `RESEND_API_KEY`, OTP codes are printed to the server terminal.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes (prod) | Secret for session tokens |
| `ADMIN_SECRET` | Yes (prod) | Secret for CSV export URL |
| `RESEND_API_KEY` | Prod | API key from [Resend](https://resend.com) to send OTP emails |
| `FROM_EMAIL` | Prod | Verified sender, e.g. `Jersey Order <noreply@dcluttr.ai>` |
| `PORT` | No | Server port (default `3001`) |
| `DATABASE_PATH` | No | SQLite file path (default `./data/jersey.db`) |

## Admin export

Download all orders as CSV:

```
GET /api/players/export?secret=YOUR_ADMIN_SECRET
```

## Deploy (Docker)

```bash
docker build -t jersey-order .
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e ADMIN_SECRET=your-admin-secret \
  -e RESEND_API_KEY=re_xxx \
  -e FROM_EMAIL="Jersey Order <noreply@dcluttr.ai>" \
  -v jersey-data:/app/data \
  jersey-order
```

Host the container on [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), or any VPS. Share the public URL with your team.

## Deploy (Railway / Render)

1. Connect this repo
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add env vars from `.env.example`
5. Attach a persistent volume at `/app/data` for the SQLite database
