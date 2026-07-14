# Admin Web

React + TypeScript + Vite admin console.

## API Configuration

Vite reads `VITE_API_BASE_URL` at build/start time.

Local development:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Local Mock DB + Admin Web

This repo owns the local mock flow for admin development: Postgres, seeded demo data, and a small mock API that serves the admin panel endpoints.

Default local database connection:

```text
jdbc:postgresql://localhost:5432/admin_web
username: admin_web
password: admin_web
```

You can change these defaults in `.env.docker`.

Start the local mock API and DB:

```bash
npm run mock:up
```

In a second terminal, start the admin web against the mock API:

```bash
npm run dev:local
```

Demo login:

```text
email: u-kisi4@student.kit.edu
code: 123456
```

Useful DB commands:

```bash
npm run mock:reset
npm run db:logs
npm run db:down
```

Production deploy build:

```env
VITE_API_BASE_URL=https://server.example.org
```

The login flow stores `/auth/login` response field `authToken` and sends it on authenticated admin requests:

```http
Authorization: Bearer <authToken>
```

Mocked admin endpoints:

- `POST /auth/request-login` with `{ "email": "user@student.kit.edu" }`
- `POST /auth/login` with `{ "email": "user@student.kit.edu", "loginToken": "123456" }`
- `GET /auth/me` with `Authorization`
- `GET /users` with `Authorization`
- `GET /comments/reported` with `Authorization`
- `GET /reports` with `Authorization`

## Scripts

```bash
npm run dev
npm run dev:local
npm run test
npm run build
npm run db:up
npm run mock:up
npm run mock:reset
```
