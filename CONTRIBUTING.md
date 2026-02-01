# Contributing to Empire Portal

## 📋 Development Workflow

### 1. Creating a New Feature

```bash
# Create a feature branch
git checkout -b feature/mercury-integration

# Make your changes
# ... code, code, code ...

# Commit with conventional commits
git commit -m "feat: add Mercury API balance fetching"

# Push and create PR
git push origin feature/mercury-integration
```

### 2. Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks (dependencies, config)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `style:` - Code formatting (not CSS)

**Examples:**
```bash
feat: add capital flow visualization
fix: correct balance calculation for MYTE accounts
docs: update API endpoint documentation
chore: upgrade Next.js to 15.0.3
```

### 3. Code Quality Checks

Before committing, ensure:

```bash
# Lint code
pnpm lint

# Type-check
pnpm typecheck

# Format code
pnpm format
```

### 4. Adding a New Package

```bash
# Create directory
mkdir packages/new-package
cd packages/new-package

# Create package.json
pnpm init

# Add to workspace (already configured in pnpm-workspace.yaml)
```

### 5. Adding a Dependency

**To a specific package:**
```bash
pnpm --filter=web add react-query
pnpm --filter=api add express-validator
```

**To a shared package:**
```bash
pnpm --filter=@empire/shared add lodash
```

**As dev dependency:**
```bash
pnpm --filter=web add -D @types/node
```

---

## 🧩 Component Guidelines

### React Component Template

```tsx
/**
 * EntityCard Component
 * Displays summary of a business entity
 */

import { Entity } from '@empire/shared';

interface EntityCardProps {
  entity: Entity;
  onClick?: () => void;
}

export function EntityCard({ entity, onClick }: EntityCardProps) {
  return (
    <div className="rounded-lg border p-4" onClick={onClick}>
      <h3 className="text-lg font-semibold">{entity.name}</h3>
      <p className="text-sm text-gray-600">{entity.legalName}</p>
    </div>
  );
}
```

### Organizing Components

```
components/
├── ui/                   # Generic UI components (Button, Card, Input)
└── features/             # Feature-specific components
    ├── entities/
    │   ├── EntityCard.tsx
    │   └── EntityList.tsx
    └── financial/
        ├── BalanceCard.tsx
        └── CapitalFlowChart.tsx
```

---

## 🔌 API Endpoint Guidelines

### Route Handler Template

```typescript
/**
 * GET /api/mercury/balances
 * Fetch balances for all Mercury accounts
 */

import { Router } from 'express';
import { prisma } from '@empire/database';
import { ApiResponse, Balance } from '@empire/shared';

const router = Router();

router.get('/balances', async (req, res) => {
  try {
    const balances = await prisma.balance.findMany({
      where: { date: new Date() },
      include: { account: true },
    });

    const response: ApiResponse<Balance[]> = {
      success: true,
      data: balances,
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        message: 'Failed to fetch balances',
        code: 'FETCH_ERROR',
      },
    };

    res.status(500).json(response);
  }
});

export default router;
```

---

## 📊 Database Changes

### Adding a New Model

1. Edit `packages/database/prisma/schema.prisma`

```prisma
model NewModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

2. Generate Prisma client
```bash
pnpm --filter=@empire/database db:generate
```

3. Push to database (dev)
```bash
pnpm --filter=@empire/database db:push
```

4. Create migration (production)
```bash
pnpm --filter=@empire/database db:migrate
```

---

## 🧪 Testing (Future)

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@empire/shared';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

### API Test Template

```typescript
import request from 'supertest';
import app from '../src/index';

describe('GET /api/mercury/balances', () => {
  it('returns balances successfully', async () => {
    const response = await request(app).get('/api/mercury/balances');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Environment variables set in Vercel/Railway
- [ ] Database migrations run
- [ ] PR reviewed and approved

---

## 🆘 Getting Help

- **Architecture questions:** See `ARCHITECTURE.md`
- **Feature specs:** `C:\Dev\projects\Keystone Business Group\Portal\SPEC.md`
- **Master plan:** `C:\Dev\projects\Keystone Business Group\MASTER_PLAN.md`

---

## 📝 Documentation

When adding a new feature:

1. **Update README.md** if it changes setup
2. **Document API endpoints** in code comments
3. **Update SPEC.md** if it changes the design
4. **Add inline comments** for complex logic

---

**Happy coding!** 🎉
