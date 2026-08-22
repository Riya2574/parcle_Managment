# Parcel Management API

Node.js and Express backend for the parcel management frontend. Data is stored in SQLite and the database starts empty. No demo records are inserted.

## Run

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

The API runs on `http://localhost:4000`.

## API

- `POST /api/auth/signup` and `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST|DELETE /api/parties`
- `GET|POST|PATCH|DELETE /api/parcels`
- `GET /api/dashboard/summary`
- `GET /api/reports/parcels`
- `GET /api/users`
- `GET|PATCH /api/settings`

Send `Authorization: Bearer <token>` to protected endpoints.
