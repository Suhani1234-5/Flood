This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Local Development (Without Docker)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Docker & Docker Compose Setup

This project is containerized using Docker and Docker Compose, allowing you to run the entire application stack (Next.js app, PostgreSQL database, and Redis cache) in isolated containers. This ensures consistency across different development environments and eliminates the "it works on my machine" problem.

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Quick Start

1. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```
   The `.env.example` file contains Docker-specific connection strings. Make sure to update any placeholder values (like `password`, `your_bot_token_here`, etc.) with your actual values.

2. **Pull the latest images and build containers:**
   ```bash
   docker compose pull
   docker compose up --build
   ```

3. **Verify the setup:**
   - App: [http://localhost:3000](http://localhost:3000)
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

   Check running containers:
   ```bash
   docker ps
   ```

### Docker Configuration

#### Dockerfile

The `Dockerfile` defines how the Next.js application is built and run:

- **Base Image**: `node:20-alpine` (lightweight Node.js 20 image)
- **Build Process**: 
  - Copies `package*.json` and installs dependencies
  - Copies project files
  - Builds the Next.js app with `npm run build`
- **Runtime**: Exposes port 3000 and starts the app with `npm run start`

#### docker-compose.yml

The `docker-compose.yml` file orchestrates three services:

1. **app** (Next.js Application)
   - Built from the Dockerfile in the current directory
   - Container name: `nextjs_app`
   - Port mapping: `3000:3000`
   - Environment variables loaded from `.env` file
   - Depends on `db` and `redis` services
   - Connected to `localnet` network

2. **db** (PostgreSQL Database)
   - Image: `postgres:15-alpine`
   - Container name: `postgres_db`
   - Port mapping: `5432:5432`
   - Environment variables from `.env` file:
     - `POSTGRES_USER`: Database username
     - `POSTGRES_PASSWORD`: Database password
     - `POSTGRES_DB`: Database name
   - Persistent volume: `db_data` (data persists across container restarts)
   - Connected to `localnet` network

3. **redis** (Redis Cache)
   - Image: `redis:7-alpine`
   - Container name: `redis_cache`
   - Port mapping: `6379:6379`
   - Connected to `localnet` network

#### Networks

- **localnet**: A bridge network that allows all services to communicate with each other using their service names as hostnames (e.g., `db`, `redis`)

#### Volumes

- **db_data**: Persistent storage for PostgreSQL data, ensuring database data survives container restarts and removals

### Environment Variables

The application uses environment variables from the `.env` file. Key variables for Docker:

- `DATABASE_URL`: Use `db` as the hostname (e.g., `postgresql://postgres:password@db:5432/mydb`)
- `REDIS_URL`: Use `redis` as the hostname (e.g., `redis://redis:6379`)

**Note**: When running without Docker, use `localhost` instead of service names.

### Common Docker Commands

```bash
# Start all services in detached mode
docker compose up -d

# View logs
docker compose logs
docker compose logs app    # View app logs only

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Rebuild containers after code changes
docker compose up --build

# Execute commands in a running container
docker compose exec app npm run lint
docker compose exec db psql -U postgres -d mydb

# View running containers
docker ps

# View container resource usage
docker stats
```

### Troubleshooting

#### Port Conflicts

If you get port conflict errors (e.g., "port 3000 is already in use"):

1. Stop the conflicting service:
   ```bash
   # For local Next.js dev server
   # Press Ctrl+C in the terminal running npm run dev
   
   # Or kill the process using the port (Windows)
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change the port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Use 3001 instead of 3000
   ```

#### Permission Errors

On Linux/Mac, if you encounter permission errors:

```bash
# Fix ownership (if needed)
sudo chown -R $USER:$USER .
```

#### Slow Builds

- The first build will be slower as it downloads base images
- Subsequent builds use Docker layer caching
- Consider using `.dockerignore` to exclude unnecessary files (already configured)

#### Database Connection Issues

- Ensure the `DATABASE_URL` in `.env` uses `db` as the hostname (not `localhost`)
- Verify the database service is running: `docker compose ps`
- Check database logs: `docker compose logs db`

#### Container Won't Start

- Check logs: `docker compose logs app`
- Verify `.env` file exists and has correct values
- Ensure no port conflicts
- Try rebuilding: `docker compose up --build --force-recreate`

### Development Workflow

1. **First-time setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   docker compose pull
   docker compose up --build
   ```

2. **Daily development:**
   ```bash
   docker compose up
   ```

3. **After code changes:**
   - The app container will need to be rebuilt for production builds
   - For development, consider mounting the source code as a volume (not included in current setup)

4. **Stopping:**
   ```bash
   docker compose down
   ```

### Production Considerations

The current Docker setup is optimized for local development. For production:

- Use multi-stage builds to reduce image size
- Set up health checks for services
- Use secrets management instead of `.env` files
- Configure proper logging and monitoring
- Set up backup strategies for database volumes

## PostgreSQL Schema Design

FloodGuard uses a **normalized relational schema** in PostgreSQL, defined with [Prisma](https://www.prisma.io/). The schema supports users, monitored locations, flood alerts, water-level readings, and user subscriptions to locations for alerts.

### Entity-Relationship Overview

```
User (1) ──< UserLocationSubscription >── (N) Location
Location (1) ──< Alert (N)
Location (1) ──< FloodReading (N)
```

| Entity | Description |
|--------|-------------|
| **User** | Registered user or team member; can subscribe to locations and receive alerts. |
| **Location** | Monitored geographic area (name, region, lat/long). |
| **UserLocationSubscription** | Many-to-many: which users receive alerts for which locations. |
| **Alert** | Flood alert for a location (severity, message, timestamp). |
| **FloodReading** | Water level reading for a location (e.g. from sensor or manual). |

### Prisma Schema Excerpt

Core models and relations (see `prisma/schema.prisma` for full schema):

```prisma
model User {
  id             Int       @id @default(autoincrement())
  name           String
  email          String    @unique
  passwordHash   String?   @map("password_hash")
  telegramChatId String?   @map("telegram_chat_id")
  subscriptions  UserLocationSubscription[]
}

model Location {
  id        Int      @id @default(autoincrement())
  name      String
  region    String
  latitude  Decimal  @db.Decimal(10, 7)
  longitude Decimal  @db.Decimal(10, 7)
  @@unique([name, region])
  subscriptions UserLocationSubscription[]
  alerts        Alert[]
  readings      FloodReading[]
}

model UserLocationSubscription {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  locationId Int      @map("location_id")
  user       User     @relation(...)
  location   Location @relation(...)
  @@unique([userId, locationId])
}

model Alert {
  id         Int          @id @default(autoincrement())
  locationId Int          @map("location_id")
  severity   AlertSeverity  // enum: LOW, MEDIUM, HIGH, CRITICAL
  message    String
  location   Location     @relation(...)
}

model FloodReading {
  id           Int      @id @default(autoincrement())
  locationId   Int      @map("location_id")
  waterLevelCm Int      @map("water_level_cm")
  recordedAt   DateTime @map("recorded_at")
  location     Location @relation(...)
}
```

### Keys, Constraints, and Relationships

- **Primary keys (PK):** Every table has an `id` (auto-increment integer) as PK.
- **Foreign keys (FK):**  
  - `UserLocationSubscription.userId` → `User.id`, `locationId` → `Location.id`  
  - `Alert.locationId` → `Location.id`  
  - `FloodReading.locationId` → `Location.id`  
  All use `onDelete: Cascade` so deleting a user or location cleans up related rows.
- **Unique constraints:**  
  - `User.email`  
  - `Location.(name, region)`  
  - `UserLocationSubscription.(userId, locationId)` (one subscription per user per location).
- **Indexes:** On FKs (`userId`, `locationId`), and on frequently queried columns (`email`, `region`, `name`, `createdAt`, `severity`, `recordedAt`) to support fast lookups and filters.

### Normalization (1NF, 2NF, 3NF)

- **1NF:** All attributes are atomic (no repeating groups; e.g. one email per user, one water level per reading).
- **2NF:** No partial dependency on PK; non-key attributes (e.g. `name`, `severity`, `message`) depend on the full primary key of their table.
- **3NF:** No transitive dependency; we avoid storing derived or redundant data (e.g. we store `locationId` in alerts/readings and join to `Location` for name/region instead of duplicating them).

Redundancy is avoided by storing each fact in one place (e.g. location details only in `Location`, subscriptions only in `UserLocationSubscription`).

### Migrations and Seed

Ensure PostgreSQL is running (e.g. `docker compose up -d db`) and `DATABASE_URL` in `.env` is correct. Then:

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migrations (run after schema changes)
npx prisma migrate dev --name init_schema

# Seed sample data (users, locations, subscriptions, alerts, readings)
npm run db:seed

# Verify in browser (Prisma Studio)
npm run db:studio
```

After running the seed, you can confirm in Prisma Studio that `users`, `locations`, `user_location_subscriptions`, `alerts`, and `flood_readings` exist and contain sample rows.

### Why This Design Supports Scalability and Common Queries

- **Scalability:** Indexes on FKs and query columns keep joins and filters fast as data grows. Normalized schema avoids duplication and keeps updates consistent. Adding new locations, users, or readings does not require schema changes.
- **Common queries the schema supports:**
  - List alerts for a location (index on `locationId`, `createdAt`).
  - List users subscribed to a location (index on `locationId` in `UserLocationSubscription`).
  - List locations a user is subscribed to (index on `userId`).
  - Latest flood readings per location (index on `locationId`, `recordedAt`).
  - Filter alerts by severity (index on `severity`).

For assignment tracking and git commands for this deliverable, see `assignments/2.13-postgresql-schema-design.md`.

## Prisma ORM Setup & Client Initialisation

Prisma ORM is the **data layer** for FloodGuard: it connects the Next.js app to PostgreSQL, provides a type-safe client for all database queries, and keeps the schema in sync with migrations. This section describes how Prisma is installed, initialised, and used in the project.

### Purpose of Prisma in This Project

- **Single source of truth:** The `prisma/schema.prisma` file defines all models, relations, and constraints. Migrations keep the database in sync with the schema.
- **Type-safe queries:** The generated Prisma Client exposes typed methods (`prisma.user.findMany()`, etc.), so TypeScript catches mistakes at compile time.
- **Connection management:** A singleton client in `src/lib/prisma.ts` is reused across the app, avoiding multiple connections and ensuring consistent behaviour in development and production.

### Setup Steps

1. **Install and initialise Prisma** (already done in this repo):
   ```bash
   npm install prisma --save-dev
   npm install @prisma/client
   npx prisma init
   ```
   This creates the `prisma/` folder and `schema.prisma`, and expects `DATABASE_URL` in `.env`.

2. **Define models** in `prisma/schema.prisma` (see [PostgreSQL Schema Design](#postgresql-schema-design) and the snippet below).

3. **Generate the Prisma Client** after any schema change:
   ```bash
   npx prisma generate
   # or
   npm run db:generate
   ```

4. **Connect Prisma to the app** via the singleton in `src/lib/prisma.ts` (see snippet below). Import `prisma` from this file everywhere you need to run queries.

5. **Test the connection:** Start the app and call an endpoint that uses Prisma (e.g. `GET /api/users`). See [Test the connection](#test-the-connection) below.

### Schema and Client Snippets

**Datasource and generator** (`prisma/schema.prisma`):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int       @id @default(autoincrement())
  name      String
  email     String    @unique
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  // ... relations
}
```

**Client initialisation** (`src/lib/prisma.ts`):

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

This keeps a single Prisma instance in development (stored on `globalThis`) so hot reloads do not create multiple connections.

### Test the Connection

1. Ensure PostgreSQL is running (e.g. `docker compose up -d db`) and `DATABASE_URL` in `.env` is correct.
2. Run migrations and seed if you have not already:
   ```bash
   npx prisma migrate dev --name init_schema
   npm run db:seed
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000/api/users](http://localhost:3000/api/users) in the browser or with `curl`.

**Expected response when the connection works:**

```json
{
  "success": true,
  "message": "Database connection successful",
  "count": 2,
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@floodguard.example", "createdAt": "..." },
    { "id": 2, "name": "Bob", "email": "bob@floodguard.example", "createdAt": "..." }
  ]
}
```

If the database is unreachable, you will get a `500` response with `"success": false` and an error message. In the terminal running `npm run dev`, Prisma will log queries when you hit `/api/users`, confirming the client is connected.

### Reflection: Type Safety, Query Reliability, and Developer Productivity

- **Type safety:** Prisma generates TypeScript types from the schema. Property names, relation names, and enums are checked at compile time, so typos and wrong field types are caught before runtime. Refactoring is safer because the compiler flags every place that needs updating.
- **Query reliability:** Queries are built with a fluent API (`findMany`, `findUnique`, `create`, etc.) instead of raw SQL strings, reducing injection risks and schema drift. Relations are loaded explicitly with `include` or `select`, so it is clear what data each query returns.
- **Developer productivity:** One schema file drives migrations, the client, and types. Prisma Studio (`npm run db:studio`) gives a quick way to inspect and edit data. The same client is used in API routes, server components, and server actions, so the data layer is consistent across the app.

For assignment tracking and git commands for this deliverable, see `assignments/2.14-prisma-orm-setup.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
