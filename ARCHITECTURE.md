# Empire Portal - Architecture Guide

## 🏗️ Repository Structure

This is a Turborepo monorepo using pnpm workspaces. All shared code lives in `packages/`, all applications in `apps/`.

```
empire-portal/
├── apps/
│   ├── web/              # Next.js 15 frontend (Vercel)
│   ├── api/              # Express backend (Railway)
│   └── workers/          # Cron workers (Railway)
│
├── packages/
│   ├── shared/           # Shared types, utilities, constants
│   ├── database/         # Prisma ORM schema + client
│   └── config/           # Shared ESLint, TypeScript, Tailwind
│
├── package.json          # Root package.json (workspaces defined)
├── pnpm-workspace.yaml   # pnpm workspace config
├── turbo.json            # Turborepo pipeline config
└── .env.example          # Environment variables template
```

---

## 📦 Package Dependency Flow

```
apps/web
  ├─ @empire/shared       (types, utils, constants)
  └─ @empire/database     (Prisma client)

apps/api
  ├─ @empire/shared
  └─ @empire/database

apps/workers
  ├─ @empire/shared
  └─ @empire/database

packages/database
  └─ @prisma/client

packages/shared
  └─ zod (validation)
```

---

## 🔧 Core Packages Explained

### `packages/shared` - Shared Code

**Purpose:** Single source of truth for types, utilities, and constants used across frontend and backend.

**Structure:**
```
packages/shared/src/
├── types/
│   ├── entities.ts       # Entity, Account, Balance types
│   ├── financial.ts      # Transaction, BusinessMetric, CapitalFlow
│   └── api.ts            # ApiResponse, PaginatedResponse
├── utils/
│   ├── currency.ts       # formatCurrency(), parsepercentage()
│   ├── dates.ts          # formatDate(), getMonthStart()
│   └── errors.ts         # MercuryAPIError, DatabaseError, etc.
└── constants/
    └── index.ts          # ENTITY_NAMES, ENTITY_TYPES, etc.
```

**Usage:**
```typescript
import { Entity, formatCurrency, ENTITY_NAMES } from '@empire/shared';

const entity: Entity = { ... };
console.log(formatCurrency(1234.56)); // "$1,234.56"
console.log(ENTITY_NAMES.KBG); // "Keystone Business Group"
```

---

### `packages/database` - Prisma ORM

**Purpose:** Database schema and Prisma client singleton.

**Key Files:**
- `prisma/schema.prisma` - Complete database schema (10 tables)
- `src/client.ts` - Prisma client singleton (prevents multiple instances)
- `src/index.ts` - Exports Prisma types + client

**Usage:**
```typescript
import { prisma } from '@empire/database';

const entities = await prisma.entity.findMany({
  include: { accounts: true },
});
```

**Commands:**
```bash
# Generate Prisma client (run after schema changes)
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Create migration (production)
pnpm db:migrate

# Open Prisma Studio (visual database browser)
pnpm db:studio
```

---

### `packages/config` - Shared Configs

**Purpose:** ESLint, TypeScript, and Tailwind configurations shared across all apps.

**Files:**
- `eslint-config/index.js` - ESLint rules
- `typescript-config/base.json` - Base TypeScript config
- `typescript-config/nextjs.json` - Next.js-specific config
- `typescript-config/node.json` - Node.js backend config

**Usage:**
```json
// In any app's tsconfig.json
{
  "extends": "@empire/typescript-config/nextjs.json"
}
```

---

## 🚀 Apps Explained

### `apps/web` - Next.js Frontend

**Tech:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Clerk (authentication)

**Structure:**
```
apps/web/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page (/)
│   └── globals.css       # Tailwind CSS
├── components/           # React components
├── lib/                  # Frontend utilities
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

**Commands:**
```bash
pnpm --filter=web dev      # Run dev server (http://localhost:3000)
pnpm --filter=web build    # Build for production
pnpm --filter=web lint     # Lint code
```

---

### `apps/api` - Express Backend

**Tech:**
- Express.js
- TypeScript
- Prisma (database)
- Clerk (auth middleware)

**Structure:**
```
apps/api/src/
├── index.ts              # Express app entry point
├── routes/               # API route handlers (to be added)
├── services/             # Business logic (to be added)
├── middleware/           # Auth, error handling (to be added)
└── workers/              # Background jobs (to be added)
```

**Commands:**
```bash
pnpm --filter=api dev      # Run dev server with hot reload
pnpm --filter=api build    # Build TypeScript to dist/
pnpm --filter=api start    # Run production build
```

---

### `apps/workers` - Cron Jobs

**Tech:**
- Node.js
- TypeScript
- Node-cron

**Purpose:** Run scheduled jobs (daily Mercury sync, weekly reports, monthly close).

**Structure (to be added):**
```
apps/workers/src/
├── jobs/
│   ├── daily.ts          # Daily 7:00 AM job
│   ├── weekly.ts         # Weekly Monday 8:00 AM job
│   └── monthly.ts        # Monthly 1st 8:00 AM job
├── scheduler.ts          # Cron scheduler setup
└── index.ts              # Worker entry point
```

---

## 🔄 Development Workflow

### 1. Install Dependencies

```bash
# From root directory
pnpm install
```

This installs all dependencies for all packages and apps.

### 2. Set Up Environment Variables

```bash
# Copy example
cp .env.example .env.local

# Edit with your credentials
# DATABASE_URL, MERCURY_*_API_KEY, etc.
```

### 3. Initialize Database

```bash
# Generate Prisma client
pnpm --filter=@empire/database db:generate

# Push schema to database (dev)
pnpm --filter=@empire/database db:push
```

### 4. Run Development Servers

```bash
# Run all apps
pnpm dev

# Or run individually
pnpm --filter=web dev      # Frontend on :3000
pnpm --filter=api dev      # Backend on :3001
```

---

## 📝 Code Conventions

### TypeScript Strict Mode

All packages use strict TypeScript:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`

### Naming Conventions

- **Components:** PascalCase (`EntityCard.tsx`)
- **Utils/Hooks:** camelCase (`useFinancialData.ts`)
- **Constants:** UPPER_SNAKE_CASE (`ENTITY_NAMES`)
- **Types:** PascalCase (`Entity`, `ApiResponse<T>`)

### Import Aliases

```typescript
// Frontend (apps/web)
import { Button } from '@/components/ui/Button';
import { Entity } from '@empire/shared';

// Backend (apps/api)
import { prisma } from '@empire/database';
import { formatCurrency } from '@empire/shared';
```

### API Response Format

All API endpoints use a standard response:
```typescript
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } }
```

Example:
```typescript
// Success
res.json({ success: true, data: entities });

// Error
res.json({ 
  success: false, 
  error: { message: 'Entity not found', code: 'NOT_FOUND' }
});
```

---

## 🧪 Testing (Future)

**Unit Tests:** Vitest  
**API Tests:** Supertest  
**E2E Tests:** Playwright

```bash
# Run tests (when implemented)
pnpm test
```

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Connected to GitHub: cortex-automations1/empire-portal
# Auto-deploy from main branch
# Environment: Production
# Domain: portal.keystonebg.us
```

### Backend (Railway)

**Services:**
1. `empire-api` - Express server
2. `empire-db` - PostgreSQL 16
3. `empire-redis` - Redis 7
4. `empire-workers` - Cron jobs

```bash
# Railway CLI deployment
railway up
```

---

## 📚 Next Steps

1. **Install dependencies:** `pnpm install`
2. **Set up .env:** Copy `.env.example` → `.env.local`
3. **Initialize database:** `pnpm --filter=@empire/database db:push`
4. **Start dev servers:** `pnpm dev`
5. **Build first feature:** Start with `/api/mercury/balances` endpoint

---

## 🆘 Troubleshooting

### "Cannot find module '@empire/shared'"

```bash
# Re-run install from root
pnpm install

# Or clean and reinstall
pnpm clean
pnpm install
```

### Prisma client not generated

```bash
pnpm --filter=@empire/database db:generate
```

### Type errors in shared packages

```bash
# Type-check all packages
pnpm typecheck
```

---

**For detailed feature specs, see:** `C:\Dev\projects\Keystone Business Group\Portal\SPEC.md`
