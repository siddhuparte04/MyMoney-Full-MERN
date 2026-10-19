# MyMoney — Full MERN Stack

A personal finance manager with React + Vite frontend, Express/Node.js REST API, MongoDB/Mongoose persistence, JWT authentication, salary division, transactions, borrow/lend records, repayments, savings goals, and charts.

## Requirements
- Node.js 18+
- MongoDB Community running locally, or a MongoDB Atlas database

## 1. Start backend
Open terminal:
```bash
cd backend
npm install
```
Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a unique random secret at least 32 characters long. Ensure MongoDB is running, then:
```bash
npm run dev
```
API health check: `http://localhost:5000/api/health`

## 2. Start frontend
Open a second terminal:
```bash
cd frontend
npm install
```
Optional: copy `frontend/.env.example` to `frontend/.env`. Then:
```bash
npm run dev
```
Open `http://localhost:5173`, register an account, and start using the dashboard.

## Features
- Register/login/logout; hashed passwords and JWT-protected routes
- Dashboard cards, income-vs-expenses bar chart, expense category chart
- Salary division with editable categories and allocation percentages
- Income/expense transaction creation, search/filter, and deletion
- Borrowed/lent records with repayment tracking and outstanding balance
- Savings goals with progress indicators
- Responsive desktop and mobile navigation
- Each user's data is scoped to their authenticated account

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET/POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/:id`
- `GET/PUT /api/budget`
- `GET/POST /api/loans`, `PATCH/DELETE /api/loans/:id`, `POST /api/loans/:id/repayments`
- `GET/POST /api/goals`, `PATCH/DELETE /api/goals/:id`

## Important notes
- Frontend uses `VITE_API_URL` (defaults to `http://localhost:5000/api`).
- Backend CORS defaults to `http://localhost:5173`; set `CLIENT_ORIGIN` if your frontend uses a different origin.
- This is a starter application, not audited financial software. Before public deployment, use HTTPS, a strong secret, secure production environment variables, backups, monitoring, tests, stricter validation, and a robust token/session strategy.
- Loan records are tracked separately from regular transaction totals. Add income/expense transactions when you want them reflected in cash-flow charts.
