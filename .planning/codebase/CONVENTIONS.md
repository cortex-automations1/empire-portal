# Coding Conventions

**Analysis Date:** February 2, 2026  
**Codebase:** Empire Portal (Next.js 15 + Express + Prisma)

---

## Naming Patterns

### Files
- **kebab-case** for all files: `mercury-service.ts`, `balance-card.tsx`
- **Components:** PascalCase.tsx for React components: `EntityCard.tsx`, `TrendChart.tsx`
- **Test files:** `*.test.ts` or `*.spec.ts` alongside source
- **Barrel exports:** `index.ts` for public API re-exports
- **Route files:** Next.js App Router convention: `page.tsx`, `layout.tsx`, `route.ts`

### Functions
- **camelCase** for all functions: `getBalance()`, `calculateFlow()`
- **No prefix** for async functions (TypeScript types show it)
- **Event handlers:** `handleEventName` pattern: `handleClick()`, `handleSubmit()`
- **API routes:** `GET`, `POST`, `PUT`, `DELETE` named exports in Next.js route files
- **React components:** PascalCase function names matching file name

### Variables
- **camelCase** for variables: `accountBalance`, `entityName`, `mercuryApiKey`
- **UPPER_SNAKE_CASE** for constants: `MAX_RETRIES`, `API_BASE_URL`, `SYNC_INTERVAL_MS`
- **No underscore prefix** (TypeScript private keyword or # syntax)
- **Boolean prefixes:** `is*`, `has*`, `should*`: `isActive`, `hasError`, `shouldRetry`

### Types & Interfaces
- **PascalCase** for interfaces: `Entity`, `Account`, `Balance`, `Transaction`
- **No I prefix:** Use `User` not `IUser`
- **Type aliases:** PascalCase: `ApiResponse`, `EntityWithAccounts`, `BalanceSnapshot`
- **Enums:** PascalCase for name, UPPER_CASE for values:
  ```typescript
  enum EntityStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ARCHIVED = 'ARCHIVED'
  }
  ```
- **Generic types:** Single uppercase letter or descriptive: `T`, `TData`, `TError`

---

## Code Style

### Formatting
- **Tool:** Prettier with `.prettierrc`
- **Line length:** 100 characters max (Prettier enforced)
- **Quotes:** Single quotes for strings (TypeScript convention)
- **Semicolons:** Required (matches Prisma generated code)
- **Indentation:** 2 spaces (Prettier default)
- **Trailing commas:** Always (easier diffs)
- **Arrow functions:** Implicit return for single expressions, explicit for blocks

### Linting
- **Tool:** ESLint with `packages/config/eslint-config/index.js`
- **Rules:** 
  - `@typescript-eslint/recommended`
  - No `any` types (use `unknown` or proper types)
  - No `console.log` in committed code (use logger or remove)
  - Unused vars not allowed (prefix with `_` if needed)
- **Run:** `pnpm lint` from root or package directory

### TypeScript
- **Strict mode:** Enabled in all `tsconfig.json` files
- **No implicit any:** Enforced
- **Type imports:** Use `import type` for type-only imports:
  ```typescript
  import type { Entity, Account } from '@empire/shared';
  import { formatCurrency } from '@empire/shared';
  ```
- **Explicit return types:** Required for exported functions, optional for internal
- **Null checks:** Use optional chaining (`?.`) and nullish coalescing (`??`)

---

## Import Organization

### Order (Enforced by ESLint)
1. **External packages** (React, Next, Express, etc.)
2. **Internal packages** (`@empire/shared`, `@empire/database`)
3. **Relative imports** (`./*`, `../*`)
4. **Type-only imports** (separate `import type` statements)
5. **Side effects** (CSS imports last)

**Example:**
```typescript
// External
import { useState, useEffect } from 'react';
import { Card } from '@tremor/react';

// Internal packages
import { formatCurrency } from '@empire/shared';
import { prisma } from '@empire/database';

// Relative imports
import { MercuryService } from './mercury-service';
import { calculateTotal } from '../utils';

// Type imports
import type { Entity, Balance } from '@empire/shared';

// Side effects
import './styles.css';
```

### Grouping
- **Blank line** between each group
- **Alphabetical** within each group (ESLint plugin)
- **Named imports** sorted alphabetically: `import { a, b, c } from 'lib';`

### Path Aliases
- **No custom aliases** (use relative paths or package imports)
- **Package imports:** `@empire/shared`, `@empire/database`, `@empire/config`
- **Turborepo handles** workspace resolution via pnpm

---

## Error Handling

### Strategy
- **Throw errors** from services/utilities
- **Catch at boundaries:** Route handlers, React error boundaries, top-level async functions
- **Typed errors:** Create custom error classes extending `Error`
- **Never swallow:** Always log before rethrowing or handle explicitly

### Custom Errors
Located in `packages/shared/src/utils/errors.ts`:
```typescript
export class MercuryAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'MercuryAPIError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Async Error Handling
- **Always use try/catch** for async/await
- **Never use .catch()** chains (use async/await consistently)
- **Log context** before throwing:
  ```typescript
  try {
    const result = await fetchData();
  } catch (error) {
    logger.error({ error, context: { userId, action } }, 'Failed to fetch data');
    throw new ApiError('Data fetch failed', { cause: error });
  }
  ```

### API Routes (Next.js)
- Return proper HTTP status codes
- Use `ApiResponse<T>` type from `@empire/shared`:
  ```typescript
  export async function GET(request: Request) {
    try {
      const data = await service.getData();
      return Response.json({ success: true, data });
    } catch (error) {
      logger.error({ error }, 'API error');
      return Response.json(
        { success: false, error: { message: 'Internal error' } },
        { status: 500 }
      );
    }
  }
  ```

---

## Logging

### Framework
- **Development:** `console.log` is acceptable for debugging (remove before commit)
- **Production:** Use Railway/Vercel logs (stdout/stderr)
- **Structured logs:** JSON format for production:
  ```typescript
  console.log(JSON.stringify({ 
    level: 'info', 
    message: 'Mercury sync complete',
    entity: 'MYTE',
    accountCount: 9,
    timestamp: new Date().toISOString()
  }));
  ```

### When to Log
- **API requests:** Method, path, status, duration
- **External API calls:** Mercury API requests, responses, errors
- **State changes:** Balance updates, sync completion, alerts triggered
- **Errors:** Always log with full context before handling
- **Security events:** Login attempts, failed auth, permission denials

### What NOT to Log
- **API keys or secrets** (mask if needed: `key: token.slice(0,8) + '...'`)
- **Passwords or sensitive data**
- **Full request/response bodies** (summarize instead)
- **Personal financial details** in production (amounts OK, but no account numbers unmasked)

---

## Comments

### When to Comment
- **Explain WHY, not WHAT:** Code should be self-documenting
  ```typescript
  // Good: Explains business logic
  // Retry 3 times because Mercury API has transient 5xx errors during maintenance windows
  const maxRetries = 3;
  
  // Bad: Explains obvious code
  // Set max retries to 3
  const maxRetries = 3;
  ```
- **Business rules:** Document requirements from SPEC.md or FINANCIAL_FLOWS.md
- **Non-obvious algorithms:** Explain complex calculations (capital flow distributions)
- **Workarounds:** Explain temporary solutions and link to issue if available
- **TODOs:** Use `// TODO:` with description (tracked in git blame)

### JSDoc/TSDoc
- **Required for:** Exported functions in services and utilities
- **Optional for:** Internal functions (if signature is clear)
- **Format:**
  ```typescript
  /**
   * Fetches current balance for a Mercury account.
   * 
   * @param apiKey - Mercury API token (secret-token:...)
   * @param accountId - Mercury account ID
   * @returns Current balance in cents
   * @throws {MercuryAPIError} If API request fails
   */
  export async function getBalance(apiKey: string, accountId: string): Promise<number> {
    // implementation
  }
  ```

### Avoid
- **Commented-out code:** Delete it (use git history)
- **Obvious comments:** `// increment counter` (code is self-explanatory)
- **Outdated comments:** Update or delete when code changes

---

## Function Design

### Size
- **Target:** Under 50 lines per function
- **Extract helpers** for complex logic (create `utils/` file)
- **Single responsibility:** Function does one thing well
- **Early returns:** Use guard clauses at top:
  ```typescript
  function process(data: Data | null) {
    if (!data) return null;
    if (!data.isValid) return null;
    
    // Main logic here
  }
  ```

### Parameters
- **Max 3 parameters:** Use options object for 4+
  ```typescript
  // Good
  function syncEntity(options: { entityId: string; force?: boolean; dryRun?: boolean }) {
    // ...
  }
  
  // Bad
  function syncEntity(entityId: string, force: boolean, dryRun: boolean, timeout: number) {
    // ...
  }
  ```
- **Destructure in signature:** `function({ id, name }: Options)`
- **Required first, optional last:** `function(required: string, optional?: number)`

### Return Values
- **Explicit returns:** Always use `return` statement
- **Consistent types:** Don't mix `T | null` and `T | undefined` (choose one)
- **Return early:** Guard clauses at top, main logic after
- **Named return object:** For multiple values: `return { balance, lastSync, error };`

---

## Module Design

### Exports
- **Named exports preferred:** `export function getBalance() { }`
- **Default exports for:** React components only
  ```typescript
  // Component file: EntityCard.tsx
  export default function EntityCard({ entity }: Props) { }
  
  // Service file: mercury-service.ts
  export function getBalance() { }
  export function getTransactions() { }
  ```

### Barrel Files (index.ts)
- **Use for public API:** Re-export only what other packages need
  ```typescript
  // packages/shared/src/index.ts
  export * from './types';
  export * from './utils';
  export * from './constants';
  ```
- **Avoid in app code:** Use direct imports in apps (better tree-shaking)

### Circular Dependencies
- **Never allow:** If A imports B and B imports A, refactor
- **Fix by:** Extract shared code to third module C
- **TypeScript will error:** Pay attention to compiler warnings

---

## React Conventions

### Components
- **Function components only:** No class components
- **Default export:** Component matches file name
  ```typescript
  // EntityCard.tsx
  export default function EntityCard() { }
  ```
- **Props type:** Named `Props` and defined inline or exported
  ```typescript
  type Props = {
    entity: Entity;
    onSelect?: (id: string) => void;
  };
  
  export default function EntityCard({ entity, onSelect }: Props) { }
  ```

### Hooks
- **Custom hooks:** Prefix with `use`: `useBalance()`, `useMercurySync()`
- **File location:** `apps/web/hooks/` for app-specific hooks
- **Return object:** Named properties: `return { data, loading, error };`

### State Management
- **useState** for local component state
- **No global state library** (React context if needed, but avoid)
- **Server state:** Fetch in Server Components (Next.js App Router)

---

## Database Conventions

### Prisma
- **Schema location:** `packages/database/prisma/schema.prisma`
- **Client:** Import from `@empire/database`
  ```typescript
  import { prisma } from '@empire/database';
  ```
- **Queries:** Use Prisma Client methods (type-safe)
- **Transactions:** Use `prisma.$transaction()` for multi-step operations
- **Raw SQL:** Avoid unless absolutely necessary (use Prisma query builder)

### Naming
- **Tables:** PascalCase singular: `Entity`, `Account`, `Balance`
- **Columns:** camelCase: `createdAt`, `accountName`, `currentBalance`
- **Relations:** Descriptive: `entity` (singular), `accounts` (plural)

---

## Git Conventions

### Commits
- **Conventional Commits:** `type(scope): message`
  - `feat(api): add Mercury balance endpoint`
  - `fix(ui): correct balance display rounding`
  - `docs(readme): update deployment instructions`
  - `chore(deps): update Prisma to 5.8.0`
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope:** Package or feature area: `api`, `web`, `database`, `mercury`

### Branches
- **Main:** `master` (production-ready code)
- **Feature branches:** `feat/descriptive-name` (delete after merge)
- **Fix branches:** `fix/issue-description`
- **Merge strategy:** Squash and merge for features (clean history)

---

## File Organization

### Apps Structure
```
apps/
├── web/                  # Next.js frontend
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   └── features/   # Feature-specific components
│   └── hooks/          # Custom React hooks
├── api/                 # Express backend
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Express middleware
│   │   └── utils/      # Utilities
└── workers/             # Cron jobs
    └── src/jobs/       # Job definitions
```

### Package Structure
```
packages/
├── shared/              # Shared types, utils, constants
│   └── src/
│       ├── types/      # TypeScript types
│       ├── utils/      # Utilities
│       └── constants/  # Constants
├── database/            # Prisma schema and client
│   ├── prisma/         # Schema and migrations
│   └── src/            # Prisma client wrapper
└── config/              # Shared configs
    ├── eslint-config/  # ESLint config
    └── typescript-config/ # TypeScript configs
```

---

## Summary Checklist

Before committing code, verify:
- [ ] File names use kebab-case (or PascalCase for React components)
- [ ] Functions use camelCase, constants use UPPER_SNAKE_CASE
- [ ] Imports organized (external → internal → relative → types)
- [ ] Error handling uses try/catch, throws typed errors
- [ ] No console.log in committed code (use logger)
- [ ] Functions under 50 lines, max 3 parameters
- [ ] Comments explain WHY, not WHAT
- [ ] TypeScript strict mode passes
- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier formatted (`pnpm format`)
- [ ] Conventional commit message

---

*Conventions established: 2026-02-02*  
*Update when patterns evolve*
