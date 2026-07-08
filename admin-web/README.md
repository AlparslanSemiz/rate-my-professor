# Admin Web

React + TypeScript + Vite admin console for the Spring Boot backend.

## API Configuration

Vite reads `VITE_API_BASE_URL` at build/start time.

Local development:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Production deploy build:

```env
VITE_API_BASE_URL=https://server.example.org
```

The login flow stores `/auth/login` response field `authToken` and sends it on authenticated admin requests:

```http
Authorization: Bearer <authToken>
```

Required backend endpoints:

- `POST /auth/request-login` with `{ "email": "user@student.kit.edu" }`
- `POST /auth/login` with `{ "email": "user@student.kit.edu", "loginToken": "123456" }`
- `GET /auth/me` with `Authorization`
- `GET /users` with `Authorization`
- `GET /comments/reported` with `Authorization`
- `GET /reports` with `Authorization`

## Scripts

```bash
npm run dev
npm run test
npm run build
```
