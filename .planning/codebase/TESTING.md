# Testing Strategy

**Analysis Date:** February 2, 2026  
**Codebase:** Empire Portal (Financial Application)  
**Testing Framework:** Vitest (unit/integration), Playwright (E2E)

---

## Testing Philosophy

### Goals
1. **Confidence:** Changes don't break existing functionality
2. **Speed:** Fast feedback loop (<5 min for full suite)
3. **Reliability:** Tests don't fail randomly (no flaky tests)
4. **Maintainability:** Easy to update when requirements change

### Priorities
- **Critical paths first:** Mercury sync, balance display, auth (Phase 5)
- **Unit tests for business logic:** Services, utilities, calculations
- **Integration tests for APIs:** Mercury integration, database queries
- **E2E tests for user flows:** Login → view dashboard → filter data

### Coverage Goals
- **Services:** 90% coverage (critical business logic)
- **API routes:** 80% coverage (happy path + error cases)
- **Utilities:** 80% coverage
- **React components:** 60% coverage (critical components only)
- **E2E:** 5-10 critical user flows

---

## Testing Pyramid

```
         ┌────────────┐
         │    E2E     │  5-10 tests (critical user flows)
         │  Playwright │  Slow, expensive, broad coverage
         └────────────┘
              ▲
              │
      ┌───────────────┐
      │  Integration   │  30-50 tests (API + DB)
      │     Vitest     │  Medium speed, realistic data
      └───────────────┘
              ▲
              │
   ┌──────────────────────┐
   │     Unit Tests        │  100+ tests (pure functions)
   │       Vitest          │  Fast, isolated, mocked deps
   └──────────────────────┘
```

**Why this shape:**
- Many unit tests (fast, cheap, catch logic bugs)
- Moderate integration tests (realistic, catch API issues)
- Few E2E tests (slow, expensive, catch UX issues)

---

## Test Organization

### File Structure

```
apps/
├── api/
│   └── src/
│       ├── services/
│       │   ├── mercury-service.ts
│       │   └── mercury-service.test.ts  ← Unit tests
│       ├── routes/
│       │   ├── mercury.routes.ts
│       │   └── mercury.routes.test.ts   ← Integration tests
│       └── utils/
│           ├── currency.ts
│           └── currency.test.ts         ← Unit tests
├── web/
│   ├── components/
│   │   └── features/
│   │       ├── EntityCard.tsx
│   │       └── EntityCard.test.tsx      ← Component tests
│   └── e2e/
│       ├── dashboard.spec.ts            ← E2E tests
│       └── balance-view.spec.ts
└── packages/
    └── shared/
        └── src/
            ├── utils/
            │   ├── format-currency.ts
            │   └── format-currency.test.ts
```

**Naming Convention:**
- Test files: `*.test.ts` or `*.spec.ts` (alongside source)
- E2E tests: `*.spec.ts` in `e2e/` directory

---

## Unit Tests

### Scope
Test **pure functions** in isolation (no external dependencies)

### What to Test
- Utilities (formatCurrency, maskAccountNumber, calculateTotal)
- Business logic calculations (capital flow distributions)
- Validation functions (input validators)
- Pure React components (no API calls)

### Framework: Vitest

**Setup:** `packages/shared/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
    },
  },
});
```

---

### Example: Utility Function Test

**File:** `packages/shared/src/utils/format-currency.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(123456)).toBe('$1,234.56');
    expect(formatCurrency(100)).toBe('$1.00');
    expect(formatCurrency(50)).toBe('$0.50');
  });

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-123456)).toBe('-$1,234.56');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles very large amounts', () => {
    expect(formatCurrency(123456789012)).toBe('$1,234,567,890.12');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(12345)).toBe('$123.45'); // 123.45 exactly
    expect(formatCurrency(12346)).toBe('$123.46'); // rounds up
  });
});
```

**Run:** `pnpm --filter=@empire/shared test`

---

### Example: Business Logic Test

**File:** `apps/api/src/services/capital-flow.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDistribution } from './capital-flow';
import type { DistributionRules } from '@empire/shared';

describe('calculateDistribution', () => {
  const rules: DistributionRules = {
    toBusiness: 0.30,
    toKFG: 0.30,
    toKBG: 0.15,
    toReserve: 0.15,
    toOwner: 0.10,
  };

  it('calculates correct distribution for profit', () => {
    const profit = 10000; // $100.00
    const result = calculateDistribution(profit, rules);

    expect(result).toEqual({
      toBusiness: 3000,  // 30%
      toKFG: 3000,       // 30%
      toKBG: 1500,       // 15%
      toReserve: 1500,   // 15%
      toOwner: 1000,     // 10%
      total: 10000,
    });
  });

  it('handles zero profit', () => {
    const result = calculateDistribution(0, rules);

    expect(result.total).toBe(0);
    expect(result.toBusiness).toBe(0);
  });

  it('throws on invalid rules (percentages dont sum to 1)', () => {
    const badRules: DistributionRules = {
      toBusiness: 0.50,
      toKFG: 0.50,
      toKBG: 0.10, // totals 1.10, should be 1.00
      toReserve: 0.00,
      toOwner: 0.00,
    };

    expect(() => calculateDistribution(10000, badRules)).toThrow('Distribution rules must sum to 1.00');
  });
});
```

---

## Integration Tests

### Scope
Test **modules working together** (API routes + services + database)

### What to Test
- API endpoints (request → response)
- Mercury API integration (mocked)
- Database operations (test database)
- Authentication flow (Phase 5)

### Mocking Strategy
- **Mock external APIs** (Mercury) - use fixtures
- **Real database** (test database) - isolated per test
- **No mocks for internal code** (services, utilities) - test real integration

---

### Test Database Setup

**Approach:** Use separate test database (reset before each test)

**File:** `apps/api/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**File:** `apps/api/src/test/setup.ts`
```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@empire/database';

// Set test database URL
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/empire_test';

beforeAll(async () => {
  // Apply migrations
  await prisma.$executeRaw`CREATE DATABASE IF NOT EXISTS empire_test`;
});

beforeEach(async () => {
  // Clear all tables before each test
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.account.deleteMany();
  await prisma.entity.deleteMany();
  // ... other tables
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

---

### Example: API Route Test

**File:** `apps/api/src/routes/mercury.routes.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index'; // Express app
import { prisma } from '@empire/database';
import * as MercuryService from '../services/mercury-service';

// Mock Mercury API calls
vi.mock('../services/mercury-service', () => ({
  getBalance: vi.fn(),
  syncEntity: vi.fn(),
}));

describe('GET /api/mercury/balances', () => {
  beforeEach(async () => {
    // Seed test data
    await prisma.entity.create({
      data: {
        id: 'myte',
        name: 'MYTE LLC',
        legalName: 'MYTE LLC',
        type: 'LLC',
        accounts: {
          create: [
            { id: 'acc1', accountName: 'Checking', currentBalance: 50000 },
            { id: 'acc2', accountName: 'Savings', currentBalance: 10000 },
          ],
        },
      },
    });
  });

  it('returns balances for all entities', async () => {
    const response = await request(app).get('/api/mercury/balances');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toMatchObject({
      accountName: 'Checking',
      currentBalance: 50000,
    });
  });

  it('filters by entity', async () => {
    const response = await request(app).get('/api/mercury/balances?entityId=myte');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it('returns 404 for unknown entity', async () => {
    const response = await request(app).get('/api/mercury/balances?entityId=unknown');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Entity not found');
  });

  it('validates query parameters', async () => {
    const response = await request(app).get('/api/mercury/balances?limit=999'); // exceeds max

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Invalid input');
  });
});

describe('POST /api/mercury/sync', () => {
  it('triggers sync for all entities', async () => {
    vi.mocked(MercuryService.syncEntity).mockResolvedValue();

    const response = await request(app).post('/api/mercury/sync');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ synced: 1, errors: 0 });
    expect(MercuryService.syncEntity).toHaveBeenCalledWith('myte');
  });

  it('handles sync errors gracefully', async () => {
    vi.mocked(MercuryService.syncEntity).mockRejectedValue(new Error('API error'));

    const response = await request(app).post('/api/mercury/sync');

    expect(response.status).toBe(200); // Still 200, reports errors in body
    expect(response.body.data.errors).toBe(1);
  });
});
```

**Run:** `pnpm --filter=@empire/api test`

---

### Mercury API Mocking

**Strategy:** Use fixtures (saved responses from real API)

**File:** `apps/api/src/test/fixtures/mercury.ts`

```typescript
export const mockMercuryAccounts = [
  {
    id: 'merc_acc_1',
    name: 'Mercury Checking 9844',
    accountNumber: '1234567890',
    routingNumber: '123456789',
    currentBalance: 67763, // $677.63 in cents
    availableBalance: 67763,
    status: 'active',
  },
  {
    id: 'merc_acc_2',
    name: 'Mercury Savings 4590',
    accountNumber: '9876543210',
    routingNumber: '123456789',
    currentBalance: 2737, // $27.37
    availableBalance: 2737,
    status: 'active',
  },
];

export const mockMercuryTransactions = [
  {
    id: 'tx_1',
    accountId: 'merc_acc_1',
    amount: -5000, // -$50.00
    description: 'AWS Services',
    date: '2026-02-01',
    status: 'posted',
  },
  {
    id: 'tx_2',
    accountId: 'merc_acc_1',
    amount: 100000, // +$1000.00
    description: 'Client Payment',
    date: '2026-02-01',
    status: 'posted',
  },
];
```

**Usage in test:**
```typescript
import { mockMercuryAccounts } from '../test/fixtures/mercury';

vi.mock('../services/mercury-service', () => ({
  getAccounts: vi.fn().mockResolvedValue(mockMercuryAccounts),
}));
```

---

## Component Tests

### Scope
Test **React components** in isolation

### What to Test
- Component renders correctly
- User interactions (click, type, submit)
- Conditional rendering (loading states, errors)
- Props handling

### Framework: Vitest + React Testing Library

**Setup:** `apps/web/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**File:** `apps/web/src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

---

### Example: Component Test

**File:** `apps/web/components/features/EntityCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntityCard from './EntityCard';
import type { Entity } from '@empire/shared';

const mockEntity: Entity = {
  id: 'myte',
  name: 'MYTE LLC',
  legalName: 'MYTE LLC',
  type: 'LLC',
  industry: 'IT',
  status: 'ACTIVE',
  totalBalance: 213758, // $2,137.58
  accountCount: 9,
};

describe('EntityCard', () => {
  it('renders entity name and balance', () => {
    render(<EntityCard entity={mockEntity} />);

    expect(screen.getByText('MYTE LLC')).toBeInTheDocument();
    expect(screen.getByText('$2,137.58')).toBeInTheDocument();
    expect(screen.getByText('9 accounts')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(<EntityCard entity={mockEntity} onSelect={handleSelect} />);

    fireEvent.click(screen.getByText('MYTE LLC'));

    expect(handleSelect).toHaveBeenCalledWith('myte');
  });

  it('shows inactive badge for inactive entities', () => {
    const inactiveEntity = { ...mockEntity, status: 'INACTIVE' as const };
    render(<EntityCard entity={inactiveEntity} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays low balance warning when balance < $1000', () => {
    const lowBalanceEntity = { ...mockEntity, totalBalance: 50000 }; // $500
    render(<EntityCard entity={lowBalanceEntity} />);

    expect(screen.getByText(/low balance/i)).toBeInTheDocument();
  });
});
```

**Run:** `pnpm --filter=@empire/web test`

---

## E2E Tests

### Scope
Test **complete user flows** in a real browser

### What to Test
- Critical user journeys (login → dashboard → filter data)
- Cross-page interactions
- Real API calls (staging environment)
- Visual regression (screenshots)

### Framework: Playwright

**Setup:** `apps/web/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Example: E2E Test

**File:** `apps/web/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login (Phase 5 - skip for now)
    // await page.goto('/sign-in');
    // await page.fill('[name="email"]', 'david@cortexautomations.ai');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');

    // Go directly to dashboard (no auth yet)
    await page.goto('/');
  });

  test('displays empire overview with all entities', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="entity-card"]');

    // Check all 6 entities are visible
    const entityCards = page.locator('[data-testid="entity-card"]');
    await expect(entityCards).toHaveCount(6);

    // Check entity names
    await expect(page.getByText('MYTE LLC')).toBeVisible();
    await expect(page.getByText('Cortex Automations')).toBeVisible();
    await expect(page.getByText('Keystone Business Group')).toBeVisible();
  });

  test('displays total empire balance', async ({ page }) => {
    // Check total balance is displayed
    const totalBalance = page.locator('[data-testid="total-balance"]');
    await expect(totalBalance).toBeVisible();

    // Balance should be formatted currency (e.g., "$10,398.80")
    await expect(totalBalance).toContainText('$');
    await expect(totalBalance).toContainText(',');
  });

  test('filters entities by clicking entity card', async ({ page }) => {
    // Click on MYTE entity card
    await page.click('text=MYTE LLC');

    // Should navigate to /businesses/myte
    await expect(page).toHaveURL('/businesses/myte');

    // Should show MYTE accounts
    await expect(page.getByText('Mercury Checking 9844')).toBeVisible();
    await expect(page.getByText('9 accounts')).toBeVisible();
  });

  test('refreshes balance data', async ({ page }) => {
    // Click refresh button
    await page.click('[data-testid="refresh-button"]');

    // Should show loading state
    await expect(page.getByText('Refreshing...')).toBeVisible();

    // Wait for refresh to complete
    await page.waitForSelector('[data-testid="refresh-button"]:not([disabled])');

    // Should show success message
    await expect(page.getByText('Balances updated')).toBeVisible();
  });

  test('mobile responsive layout', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check entity cards stack vertically
    const entityCards = page.locator('[data-testid="entity-card"]');
    const firstCard = entityCards.first();
    const secondCard = entityCards.nth(1);

    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    // Second card should be below first card (not side-by-side)
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);
  });
});
```

**Run:** `pnpm --filter=@empire/web test:e2e`

---

## Test Data Management

### Test Database

**Approach:** Isolated test database (reset before each test)

**Setup:**
```bash
# Create test database
createdb empire_test

# Run migrations
DATABASE_URL="postgresql://localhost/empire_test" pnpm --filter=@empire/database db:push
```

**Seed Data:**
```typescript
// apps/api/src/test/seed.ts
export async function seedTestData() {
  await prisma.entity.createMany({
    data: [
      { id: 'myte', name: 'MYTE LLC', legalName: 'MYTE LLC', type: 'LLC', industry: 'IT', status: 'ACTIVE' },
      { id: 'cortex', name: 'Cortex Automations', legalName: 'Cortex Automations LLC', type: 'LLC', industry: 'Software', status: 'ACTIVE' },
    ],
  });

  await prisma.account.createMany({
    data: [
      { id: 'acc1', entityId: 'myte', accountName: 'Checking', currentBalance: 67763 },
      { id: 'acc2', entityId: 'myte', accountName: 'Savings', currentBalance: 2737 },
    ],
  });
}
```

---

### Fixtures

**Location:** `apps/api/src/test/fixtures/`

**Files:**
- `mercury.ts` - Mercury API responses
- `entities.ts` - Entity data
- `accounts.ts` - Account data
- `transactions.ts` - Transaction data

**Usage:**
```typescript
import { mockMercuryAccounts } from '../test/fixtures/mercury';

vi.mock('../services/mercury-service', () => ({
  getAccounts: vi.fn().mockResolvedValue(mockMercuryAccounts),
}));
```

---

## Running Tests

### Commands

**All tests:**
```bash
pnpm test  # From root (runs all packages)
```

**Specific package:**
```bash
pnpm --filter=@empire/api test
pnpm --filter=@empire/web test
pnpm --filter=@empire/shared test
```

**Watch mode:**
```bash
pnpm --filter=@empire/api test --watch
```

**Coverage:**
```bash
pnpm --filter=@empire/api test --coverage
```

**E2E tests:**
```bash
pnpm --filter=@empire/web test:e2e
```

**E2E headless:**
```bash
pnpm --filter=@empire/web test:e2e --headed  # Show browser
```

---

### CI/CD Integration

**GitHub Actions:** `.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: empire_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test
      - run: pnpm --filter=@empire/web test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Test Coverage Tracking

### Goals
- **Services:** 90% line coverage
- **API routes:** 80% line coverage
- **Utilities:** 80% line coverage
- **Components:** 60% line coverage

### Reporting

**Generate report:**
```bash
pnpm --filter=@empire/api test --coverage
```

**View report:**
```bash
open coverage/index.html
```

**CI Integration:**
- Upload to Codecov or Coveralls
- Block merge if coverage drops >5%

---

## Common Testing Patterns

### Pattern: Mocking Mercury API

```typescript
import { vi } from 'vitest';
import * as MercuryService from '../services/mercury-service';

vi.mock('../services/mercury-service', () => ({
  getAccounts: vi.fn(),
  getBalance: vi.fn(),
}));

// In test
vi.mocked(MercuryService.getBalance).mockResolvedValue(50000);
```

---

### Pattern: Testing Async Functions

```typescript
it('fetches balance from Mercury', async () => {
  const balance = await MercuryService.getBalance('key', 'acc1');
  expect(balance).toBe(50000);
});
```

---

### Pattern: Testing Error Handling

```typescript
it('throws MercuryAPIError on 401', async () => {
  vi.mocked(fetch).mockResolvedValue({
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  });

  await expect(MercuryService.getBalance('invalid', 'acc1')).rejects.toThrow(MercuryAPIError);
});
```

---

### Pattern: Testing React Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useBalance } from './use-balance';

it('fetches balance on mount', async () => {
  const { result } = renderHook(() => useBalance('myte'));

  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.data).toEqual([...]);
});
```

---

## Testing Checklist

Before merging code:

- [ ] Unit tests for new functions (90% coverage for services)
- [ ] Integration tests for new API routes (happy path + error cases)
- [ ] Component tests for new UI components (render + interactions)
- [ ] All tests passing (`pnpm test`)
- [ ] No flaky tests (run 3 times, all pass)
- [ ] Coverage maintained (no drop >5%)

---

## Future Improvements

**Phase 7 (Polish & Testing):**
- Add E2E tests for critical flows (5-10 tests)
- Increase coverage to 80%+ overall
- Add visual regression testing (Chromatic or Percy)
- Set up CI/CD pipeline (GitHub Actions)

**Post-Launch:**
- Performance testing (k6 or Artillery)
- Security testing (OWASP ZAP)
- Load testing (stress test Mercury sync with 100 entities)

---

*Testing strategy documented: 2026-02-02*  
*Update when new test patterns emerge*
