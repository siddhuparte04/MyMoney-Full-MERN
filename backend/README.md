# MyMoney Backend API

Express + MongoDB/Mongoose backend for the MyMoney React personal finance dashboard.

## Requirements
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup
1. Open a terminal in this `mymoney-backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`.
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
4. Update `MONGODB_URI`.
5. Replace `JWT_SECRET` with a long random secret (32+ characters).
6. Start development server:
   ```bash
   npm run dev
   ```
7. Check `http://localhost:5000/api/health`.

## API routes

Public:
- `POST /api/auth/register` — `{ "name": "Siddesh", "email": "you@example.com", "password": "at-least-8-chars" }`
- `POST /api/auth/login` — `{ "email": "you@example.com", "password": "..." }`
- `GET /api/health`

Protected routes require:
`Authorization: Bearer YOUR_JWT_TOKEN`

- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/budget`
- `PUT /api/budget`
- `GET /api/loans`
- `POST /api/loans`
- `PATCH /api/loans/:id`
- `POST /api/loans/:id/repayments`
- `DELETE /api/loans/:id`
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/:id`
- `DELETE /api/goals/:id`

## Example: create an expense
`POST /api/transactions` with JSON:
```json
{
  "date": "2026-10-19",
  "description": "Groceries",
  "category": "Food & Dining",
  "amount": 450,
  "type": "Expense",
  "note": "Weekly shopping"
}
```

## Important
- Every finance record is scoped to the authenticated user.
- Passwords are hashed with bcrypt; the API returns a signed JWT after login.
- Use HTTPS in production, keep `.env` private, and use a strong unique JWT secret.
- This is an API starter. Before public deployment, add tests, backups, monitoring, and consider refresh-token/session rotation and stricter request validation.
- The React template previously supplied uses localStorage directly. This backend will not connect to it automatically; the frontend must be updated to call these API routes and send the JWT in its Authorization header.
