# PropX SaaS Application Foundation

PropX is a production-ready SaaS application built with a Clean Architecture paradigm. This repository contains the foundation for both the frontend (React) and backend (Express) services.

## Architecture

This project is separated into two primary directories:
- **`backend/`**: Node.js, Express, TypeScript, and Prisma ORM targeting PostgreSQL. Follows Clean Architecture separation: controllers, routing, services, configuration, and middleware.
- **`frontend/`**: React, Vite, TypeScript, React Router, React Query, and Tailwind CSS. Structured for maintainability, reuse, and rich user experiences.

---

## Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher) or yarn/pnpm
- [Docker](https://www.docker.com/) (for running PostgreSQL locally)

---

## Setup Instructions

### 1. Database Setup
Start the local PostgreSQL container using Docker:
```bash
docker compose up -d
```
This spins up a PostgreSQL instance on port `5432` with the database name `propx_db`.

### 2. Backend Configuration
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the environment variables template:
   ```bash
   copy .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the initial database migration to configure your PostgreSQL schema:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will be live at `http://localhost:5000`. You can query the health endpoint at `http://localhost:5000/api/health`.

### 3. Frontend Configuration
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be live at `http://localhost:5173`.

---

## Available Scripts

### Root Directory
- Run PostgreSQL with docker compose: `docker compose up -d`
- Tear down PostgreSQL service: `docker compose down`

### Backend Directory (`backend/`)
- `npm run dev`: Runs the backend in development mode with live reload using `ts-node-dev`.
- `npm run build`: Compiles TypeScript files into production JavaScript in `dist/`.
- `npm run start`: Runs the built production server using `node dist/server.js`.
- `npm run db:migrate`: Runs migrations against the PostgreSQL database.
- `npm run db:studio`: Opens Prisma Studio to visually manage database records.
- `npm run lint`: Checks for linting errors using ESLint.
- `npm run format`: Formats code style using Prettier.

### Frontend Directory (`frontend/`)
- `npm run dev`: Runs the Vite local dev server.
- `npm run build`: Compiles production React assets in `dist/`.
- `npm run lint`: Checks for linting errors.
- `npm run preview`: Previews the production build locally.
