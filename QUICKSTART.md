# Empire Portal - Quick Start Guide

Get the portal running locally in 5 minutes.

## ⚡ Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm 8+ (`npm install -g pnpm`)
- PostgreSQL 14+ (or Railway/Supabase database)

---

## 🚀 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/cortex-automations1/empire-portal.git
cd empire-portal
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all apps and packages in the monorepo.

### 3. Set Up Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your credentials
# Minimum required:
# - DATABASE_URL (PostgreSQL connection string)
# - CLERK_SECRET_KEY (from clerk.com)
# - CLERK_PUBLISHABLE_KEY (from clerk.com)
```

**Example `.env.local`:**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/empire_portal"
CLERK_SECRET_KEY="sk_test_xxx"
CLERK_PUBLISHABLE_KEY="pk_test_xxx"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
```

### 4. Initialize Database

```bash
# Generate Prisma client
pnpm --filter=@empire/database db:generate

# Push schema to database (creates tables)
pnpm --filter=@empire/database db:push
```

### 5. Start Development Servers

```bash
# Run all apps
pnpm dev
```

This starts:
- **Frontend** on http://localhost:3000 (Next.js)
- **Backend API** on http://localhost:3001 (Express)

---

## ✅ Verify Everything Works

### Frontend Check

Open http://localhost:3000

You should see:
```
Empire Portal
Unified command center for Keystone Business Group
```

### Backend Check

Open http://localhost:3001/api/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-01T...",
  "services": {
    "database": "up"
  }
}
```

---

## 📝 Next Steps

### 1. Explore the Codebase

```
empire-portal/
├── apps/web/          # Frontend (Next.js)
├── apps/api/          # Backend (Express)
├── packages/shared/   # Shared types/utils
└── packages/database/ # Prisma ORM
```

### 2. Build Your First Feature

**Example: Add a test endpoint**

```typescript
// apps/api/src/index.ts

app.get('/api/entities', async (req, res) => {
  const entities = await prisma.entity.findMany();
  res.json({ success: true, data: entities });
});
```

### 3. Use Shared Utilities

```typescript
import { formatCurrency, ENTITY_NAMES } from '@empire/shared';

console.log(formatCurrency(1234.56)); // "$1,234.56"
console.log(ENTITY_NAMES.KBG); // "Keystone Business Group"
```

---

## 🛠️ Common Commands

```bash
# Development
pnpm dev                       # Run all apps
pnpm --filter=web dev         # Run frontend only
pnpm --filter=api dev         # Run backend only

# Build
pnpm build                    # Build all apps
pnpm --filter=web build       # Build frontend

# Database
pnpm --filter=@empire/database db:generate   # Generate Prisma client
pnpm --filter=@empire/database db:push       # Push schema to DB
pnpm --filter=@empire/database db:studio     # Open Prisma Studio

# Code Quality
pnpm lint                     # Lint all packages
pnpm typecheck                # Type-check all packages
pnpm format                   # Format code with Prettier

# Clean
pnpm clean                    # Remove node_modules and build files
```

---

## 🐛 Troubleshooting

### "Cannot find module '@empire/shared'"

```bash
# Re-install from root
pnpm install
```

### Database connection error

```bash
# Check DATABASE_URL in .env.local
# Make sure PostgreSQL is running
# Verify connection string format:
# postgresql://user:password@host:port/database
```

### TypeScript errors

```bash
# Regenerate Prisma client
pnpm --filter=@empire/database db:generate

# Type-check all packages
pnpm typecheck
```

### Port already in use

```bash
# Kill process on port 3000 (frontend)
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 📚 Documentation

- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Full Spec:** `C:\Dev\projects\Keystone Business Group\Portal\SPEC.md`

---

## 🎉 You're Ready!

Frontend: http://localhost:3000  
Backend: http://localhost:3001  
Prisma Studio: Run `pnpm --filter=@empire/database db:studio`

**Happy coding!** 🚀
