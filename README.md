# Empire Portal

Unified command center for Keystone Business Group - managing 6 entities, 30+ bank accounts, and real-time financial operations.

## 🏗️ Architecture

This is a [Turborepo](https://turbo.build/repo) monorepo using pnpm workspaces.

### Apps

- **`apps/web`** - Next.js 15 frontend (Vercel)
- **`apps/api`** - Express backend (Railway)
- **`apps/workers`** - Cron job workers (Railway)

### Packages

- **`packages/ui`** - Shared UI components (shadcn/ui + Tailwind)
- **`packages/shared`** - Shared types, utilities, constants
- **`packages/database`** - Prisma schema and database client
- **`packages/config`** - Shared ESLint, TypeScript, Tailwind configs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Development

```bash
# Run all apps in dev mode
pnpm dev

# Run specific app
pnpm dev --filter=web
pnpm dev --filter=api

# Build all apps
pnpm build

# Lint all packages
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format
```

## 📁 Project Structure

```
empire-portal/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Express backend
│   └── workers/      # Cron workers
├── packages/
│   ├── ui/           # Shared UI components
│   ├── shared/       # Types, utils, constants
│   ├── database/     # Prisma ORM
│   └── config/       # Shared configs
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

## 🔧 Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Tremor
- **Backend:** Express, TypeScript, Prisma, PostgreSQL, Redis
- **Auth:** Clerk
- **Email:** Resend + React Email
- **Hosting:** Vercel (frontend) + Railway (backend)
- **Monitoring:** Sentry

## 📚 Documentation

- [Full Specification](../Keystone%20Business%20Group/Portal/SPEC.md)
- [Master Plan](../Keystone%20Business%20Group/MASTER_PLAN.md)

## 🔐 Security

- Never commit `.env` files
- All API keys stored in Railway/Vercel secrets
- MFA required for all users (Clerk)
- Audit logs for all financial actions

## 📄 License

Private - Keystone Business Group LLC

## 👥 Team

Built by Cortex Automations for Keystone Business Group
