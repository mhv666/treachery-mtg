# Treachery MTG

A multiplayer card game web app built with Astro and PostgreSQL.

## Prerequisites

- Node.js >= 22.12.0
- PostgreSQL database
- pnpm

## Database Setup

### Option 1: Docker (Recommended)

```bash
docker run -d \
  --name treachery-db \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=treachery \
  postgres:18-alpine
```

### Option 2: Local PostgreSQL

Create a database named `treachery` on your local PostgreSQL instance.

## Environment Configuration

Copy the example environment file and configure your database connection:

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```
DATABASE_URL=postgres://postgres:secret@localhost:5432/treachery
```

Replace the connection string with your actual PostgreSQL credentials:
- `postgres` - database user
- `secret` - database password
- `localhost:5432` - host and port
- `treachery` - database name

## Installation & Running

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:4321`.

## Commands

| Command | Action |
| :------ | :----- |
| `pnpm install` | Installs dependencies |
| `pnpm dev` | Starts dev server at `localhost:4321` |
| `pnpm build` | Builds for production to `./dist/` |
| `pnpm preview` | Previews production build locally |

## Project Structure

```
/
├── src/
│   ├── components/     # UI components
│   ├── db/             # Database connection
│   ├── layouts/        # Page layouts
│   ├── lib/            # Utilities and events
│   └── pages/          # Routes and API endpoints
├── public/             # Static assets
└── .env.example        # Environment variables template
```
