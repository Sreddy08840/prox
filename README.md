# PropX SaaS Application Foundation

PropX is a production-ready, multi-tenant Real Estate CRM, Lead Qualification, & Leasing Management SaaS Platform. This repository contains the foundation for both the frontend (React + Vite) and backend (Node.js + Express) services, architected with a Clean Architecture paradigm.

---

## Table of Contents

- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Directory Structure](#directory-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup & Configuration](#local-setup--configuration)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Production Deployment](#production-deployment)

---

## Core Features

- **Multi-Tenant SaaS Foundation**: Clean organizational isolation using multi-tenant PostgreSQL schemas managed by [Prisma ORM](file:///e:/porjects/prox/backend/prisma/schema.prisma).
- **AI-Powered Lead Insights & Scoring**: Real-time analysis of customer chat transcript histories using Anthropic Claude (and simulated fallback modes). Extends leads profiles with:
  - **Lead Score**: Categorizes leads automatically into `HOT`, `WARM`, or `COLD` segments.
  - **Structured Inferences**: Extract budget limits, purchase/lease timelines, financing statuses, and intent.
  - **Auto-Generated Drafts**: Context-aware draft auto-replies to accelerate communication.
- **WhatsApp Webhook Ingestion**: Complete webhooks interface to receive Meta WhatsApp Business API messages in real-time, auto-create leads, log conversation threads, and trigger AI qualifications.
- **Real Estate Inventory & Projects**: Interactive visualization of buildings and development projects:
  - Configure unit types (number of rooms, bathrooms, size, pricing).
  - Map units inventory (interactive coordinates, status tags: `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED`, `MAINTENANCE`).
- **Leasing & Tenant Database**: Direct tenant registration workflows, lease agreement scheduling (Active, Upcoming, Terminated, Expired status handling), and rental deposits tracking.
- **Unified Command Palette**: Quick access navigation modal (accessible via `CMD+K` or search) to inspect projects, leads, units, and reports instantly.
- **HubSpot & Webhook CRM Sync**: Automate one-way integrations by pushing qualified lead updates into HubSpot CRM and dispatching outbound webhooks to configured server endpoints.
- **Live Sandbox Simulator**: A frontend console page built to mock WhatsApp customer inbound triggers and visually trace AI pipeline computations and logs.

---

## System Architecture

The project is structured under a Clean Architecture framework with decoupled layers for request handling, domain schemas, business services, and database persistence.

```mermaid
graph TD
    subgraph Client-Side
        A[React & Vite SPA] -->|Axios Calls| B[Express API Gateway]
    end
    
    subgraph Service-Layer
        B --> C[Auth / JWT Validation]
        B --> D[Controllers]
        D --> E[Services Layer]
        
        E -->|AI Analysis| F[AI Providers: Anthropic / Mock]
        E -->|CRM Pipeline| G[CRM Sync Service: HubSpot & Webhook]
        E -->|Messaging| H[WhatsApp & Email Dispatchers]
    end

    subgraph Data-Layer
        E -->|Prisma Client| I[(PostgreSQL DB)]
    end
```

---

## Directory Structure

```text
prox/
├── backend/                       # Express & Node.js backend environment
│   ├── prisma/                    # Schema models, seeds, and migration scripts
│   │   └── schema.prisma          # Database schema configurations
│   ├── src/
│   │   ├── app.ts                 # Express app initialization & route registration
│   │   ├── server.ts              # HTTP listener script
│   │   ├── config/                # DB credentials, prompt templates, and configs
│   │   ├── controllers/           # HTTP Request handlers mapping to Services
│   │   ├── middlewares/           # Authentication, validations, and rate-limits
│   │   ├── routes/                # API router configuration mountpoints
│   │   ├── services/              # AI providers, CRM integration, messaging, cache
│   │   └── utils/                 # Logging utilities and lead routing scripts
│   └── tsconfig.json              # TypeScript compilation specifications
├── frontend/                      # React & Tailwind CSS client-side SPA
│   ├── src/
│   │   ├── App.tsx                # Main Router, Navigation layouts, and command palette
│   │   ├── main.tsx               # Entry point mounting React DOM
│   │   ├── components/            # Shared components (AI Insights, Unit Inventory, etc.)
│   │   ├── context/               # Global state providers
│   │   ├── pages/                 # Layout pages (Dashboard, Admin, Tenants, Leads)
│   │   └── services/              # API clients & backend endpoints integration
│   ├── tailwind.config.js         # Styling design tokens
│   └── vite.config.ts             # Dev server config
├── docker-compose.yml             # Local PostgreSQL orchestration
└── deployment_guide.md            # Production deployment reference
```

---

## Tech Stack

### Backend
- **Framework**: Express.js with TypeScript (`ts-node-dev` for development)
- **Database Access**: Prisma ORM (targeting PostgreSQL)
- **Security & Utilities**: `helmet`, `express-rate-limit`, `cookie-parser`, `bcryptjs`, `jsonwebtoken`
- **Validation**: `zod` schema verification
- **Logging**: `winston` structured logger

### Frontend
- **Framework**: React 18 with Vite and TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS custom gradients, and Lucide React Icons
- **Queries & Routing**: TanStack React Query, React Router DOM v6


---

## Prerequisites

Ensure you have the following installed locally:
- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [npm](https://www.npmjs.com/) (v9.x or higher)
- [Docker & Docker Compose](https://www.docker.com/) (for running database clusters)

---

## Local Setup & Configuration

### 1. Database Setup
Spin up the local PostgreSQL database using Docker:
```bash
docker compose up -d
```
This starts PostgreSQL on port `5432` and creates the `propx_db` database.

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the example configurations file:
   ```bash
   copy .env.example .env
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Run the Prisma migrations to create tables and database structures:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Launch the backend server in development mode:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`. You can query the health endpoint at `http://localhost:5000/api/v1/health`.

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The application UI will run at `http://localhost:5173`. Open this URL in your browser and sign in with the default credentials (`admin@propx.com` / `adminpassword`).

---

## Environment Configuration

Configure the `.env` variables inside the `backend/` folder:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Local server port | `5000` |
| `NODE_ENV` | Application environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgrespassword@localhost:5432/propx_db?schema=public` |
| `JWT_SECRET` | Security key to sign JWT tokens | `super-secret-jwt-key-change-in-production` |
| `JWT_EXPIRES_IN` | JWT token life duration | `7d` |
| `AI_PROVIDER` | Selection of AI integration engine | `mock` or `anthropic` |
| `ANTHROPIC_API_KEY` | Meta Graph or Anthropic key | `sk-ant-xxx` |
| `ANTHROPIC_MODEL` | Claude model selection | `claude-3-5-sonnet-20240620` |

---

## Available Scripts

### Root Directory
- Run local database service: `docker compose up -d`
- Stop database service: `docker compose down`

### Backend (`backend/`)
- `npm run dev`: Runs the backend in watch mode using `ts-node-dev`.
- `npm run build`: Compiles TypeScript files into compiled JavaScript inside `dist/`.
- `npm run start`: Executes the production build of the server.
- `npm run db:migrate`: Executes Prisma database schema migrations.
- `npm run db:studio`: Opens a browser visual database explorer.
- `npm run lint`: Scans TypeScript files for issues using ESLint.
- `npm run format`: Prettifies code styling.

### Frontend (`frontend/`)
- `npm run dev`: Starts the Vite local client development server.
- `npm run build`: Bundles the React assets into `dist/` directory.
- `npm run preview`: Hosts the production bundle locally for previewing.
- `npm run lint`: Performs static analysis checking for code errors.

---

## Production Deployment

For deploying the PropX platform in production on cloud platforms (e.g. AWS ECS Fargate, RDS PostgreSQL, and ElastiCache Redis clusters), refer to the detailed guide:
👉 **[Production Deployment Guide](file:///e:/porjects/prox/deployment_guide.md)**

