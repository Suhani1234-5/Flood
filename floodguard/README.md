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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
