# Phase 2: Mercury Integration & Core API - Plan

**Status:** 🔄 In Progress (20% complete)  
**Started:** February 2, 2026  
**Target Complete:** February 5, 2026  
**Estimated Duration:** 3 days  
**Lead:** Milo (OpenClaw AI)

---

## Objectives

Build the Mercury Bank integration layer and core API endpoints to fetch real-time balance and transaction data for all 6 entities (30+ accounts).

---

## Success Criteria

- [ ] Can fetch balances from all 6 Mercury entities via API
- [ ] Transaction history retrieves correctly with filters
- [ ] Data syncs automatically every 5 minutes
- [ ] Error handling graceful and logged
- [ ] Daily sync cron job running at 7 AM CST
- [ ] Database populated with real account data

---

## Tasks

### Task 1: Mercury Service Layer ⏳

**File:** `apps/api/src/services/mercury.service.ts`

**Functions to implement:**
```typescript
getAccountsForEntity(apiKey: string): Promise<Account[]>
getBalance(apiKey: string, accountId: string): Promise<number>
getTransactions(apiKey: string, accountId: string, filters?: TransactionFilters): Promise<Transaction[]>
syncEntity(entityName: string): Promise<void>
syncAllEntities(): Promise<void>
```

**Requirements:**
- Use Mercury API credentials from environment variables
- Handle rate limiting (wait and retry)
- Exponential backoff on failures (3 attempts max)
- Log all API calls (success and failure)
- Store balance snapshots in database (Balance table)
- Store transactions in database (Transaction table)
- Use proper types from `@empire/shared`

**Error Handling:**
- `MercuryAPIError` for API failures (with status code)
- Graceful degradation (if one entity fails, continue with others)
- Alert David via WhatsApp on critical failures

**Testing:**
- [ ] Test with real Mercury API keys
- [ ] Verify balance accuracy against Mercury dashboard
- [ ] Test transaction filtering (date, amount, description)
- [ ] Simulate API failures (invalid token, network error)

---

### Task 2: API Routes ⏳

**File:** `apps/api/src/routes/mercury.routes.ts`

**Endpoints:**

**GET `/api/mercury/balances`**
- Returns all balances across all entities
- Response: `{ success: true, data: Balance[] }`
- Cached for 5 minutes (Redis)

**GET `/api/mercury/balances/:entity`**
- Returns balances for specific entity (kbg, myte, cortex, etc.)
- Response: `{ success: true, data: Balance[] }`

**GET `/api/mercury/transactions`**
- Query params: `entity`, `accountId`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `search`
- Returns filtered transactions
- Response: `{ success: true, data: Transaction[] }`
- Paginated (limit 100 per page)

**POST `/api/mercury/sync`**
- Triggers manual sync for all entities
- Requires authentication (Clerk)
- Response: `{ success: true, data: { synced: number, errors: number } }`

**Requirements:**
- All routes use standard `ApiResponse<T>` format
- Error responses include helpful messages
- Rate limiting: 100 req/15min per IP
- Authenticated routes require Clerk token (Phase 5)
- CORS enabled for portal.keystonebg.us

---

### Task 3: Middleware ⏳

**Files:**
- `apps/api/src/middleware/error.ts` - Global error handler
- `apps/api/src/middleware/rateLimit.ts` - Express rate limiter
- `apps/api/src/middleware/logging.ts` - Request logging

**Error Middleware:**
```typescript
function errorHandler(err: Error, req, res, next)
  if (err instanceof MercuryAPIError) → return proper error response
  if (err instanceof DatabaseError) → log query, return 500
  else → log full error, return 500
```

**Rate Limit:**
- 100 requests per 15 minutes per IP
- Return 429 with `Retry-After` header
- Exclude health check endpoint

**Logging:**
- Log all requests (method, path, status, duration)
- Log errors with stack trace
- Use Railway logs (stdout)

---

### Task 4: Database Seeding ⏳

**File:** `apps/api/src/scripts/seed.ts`

**Seed Data:**
- [ ] Insert 6 entities (KBG, KFG, MYTE, Cortex, Vizion, Thryve, Summit)
  - Include: name, legalName, type, industry, status, mercuryKey
- [ ] Fetch and insert all accounts from Mercury API (30+ accounts)
  - Include: entityId, mercuryAccountId, accountName, accountType, routingNumber, accountNumber
- [ ] Fetch and insert initial balance snapshots (today's date)
- [ ] Fetch and insert recent transactions (last 30 days)

**Run:**
```bash
cd apps/api
npx tsx src/scripts/seed.ts
```

---

### Task 5: Cron Worker - Daily Sync ⏳

**File:** `apps/workers/src/jobs/daily-sync.ts`

**Job Logic:**
```typescript
1. For each entity (KBG, KFG, MYTE, Cortex, Vizion, Thryve):
   a. Fetch all accounts
   b. Fetch current balance for each account
   c. Store balance snapshot in database (Balance table)
   d. Fetch new transactions since last sync
   e. Store transactions in database (Transaction table)
2. Log sync results (accounts synced, new transactions, errors)
3. If errors, alert David via WhatsApp (critical failures only)
```

**Schedule:**
- Cron: `0 7 * * *` (7:00 AM CST daily)
- Also: Every 5 minutes during business hours (9 AM - 6 PM)
  - Cron: `*/5 9-18 * * *`

**Error Handling:**
- Retry failed entities up to 3 times
- Log all errors to Railway
- Send WhatsApp alert if all retries fail

**Deployment:**
- Deploy to Railway as separate service (`empire-workers`)
- Environment variables: DATABASE_URL, MERCURY_*_API_KEY

---

### Task 6: Testing & Verification ⏳

**API Tests:**
- [ ] Test `/api/mercury/balances` returns all entities
- [ ] Test `/api/mercury/balances/myte` returns only MYTE
- [ ] Test `/api/mercury/transactions` with filters
- [ ] Test `/api/mercury/sync` triggers sync

**Data Verification:**
- [ ] Compare balances in database vs Mercury dashboard
- [ ] Verify transaction data accuracy (amount, date, description)
- [ ] Check balance snapshots created daily

**Error Scenarios:**
- [ ] Invalid API key → graceful error message
- [ ] Network failure → retry logic works
- [ ] Rate limit hit → wait and retry
- [ ] Database connection lost → proper error handling

**Performance:**
- [ ] API responds in <500ms
- [ ] Sync completes in <2 minutes (all entities)
- [ ] Database queries use indexes (explain plans)

---

## Technical Design

### Mercury API Integration

**Endpoints Used:**
```
GET https://api.mercury.com/api/v1/accounts
GET https://api.mercury.com/api/v1/account/{id}
GET https://api.mercury.com/api/v1/transactions?accountId={id}&startDate={date}
```

**Authentication:**
```
Authorization: Bearer secret-token:mercury_production_wma_...
```

**Rate Limits:**
- 100 requests per minute per token
- Strategy: Batch requests, cache aggressively

### Data Flow

```
Mercury API
    ↓
mercury.service.ts (fetch, transform)
    ↓
Prisma ORM (store)
    ↓
PostgreSQL (persist)
    ↓
API Routes (serve)
    ↓
Frontend (display)
```

### Caching Strategy

- Redis cache for balance data (5 min TTL)
- Stale-while-revalidate pattern
- Cache key format: `balance:{entity}:{accountId}`

---

## Environment Variables Required

**Already in `.secrets`:**
- `MERCURY_KAMI_API_KEY`
- `MERCURY_DAVID_API_KEY`
- `MERCURY_KBG_API_KEY`
- `MERCURY_CORTEX_API_KEY`
- `MERCURY_MYTE_API_KEY`
- `MERCURY_THRYVE_API_KEY`

**Need to add to Railway:**
```bash
railway variables set MERCURY_KAMI_API_KEY="secret-token:..."
railway variables set MERCURY_DAVID_API_KEY="secret-token:..."
railway variables set MERCURY_KBG_API_KEY="secret-token:..."
railway variables set MERCURY_CORTEX_API_KEY="secret-token:..."
railway variables set MERCURY_MYTE_API_KEY="secret-token:..."
railway variables set MERCURY_THRYVE_API_KEY="secret-token:..."
```

---

## Dependencies

**New Packages:**
- None (using existing fetch/axios)

**External Services:**
- Mercury Bank API (production tokens)
- Railway PostgreSQL (already deployed)
- Railway Redis (need to add)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mercury API rate limits | High | Cache aggressively, batch requests |
| API token expiration | High | Monitor, alert on auth failures |
| Network failures | Medium | Retry logic with exponential backoff |
| Database performance | Medium | Add indexes, optimize queries |
| Sync job failures | High | Error logging, WhatsApp alerts |

---

## Acceptance Checklist

- [ ] Mercury service layer implemented
- [ ] 4 API endpoints working (`/balances`, `/balances/:entity`, `/transactions`, `/sync`)
- [ ] Daily sync cron job deployed and running
- [ ] Database seeded with real account data
- [ ] Error handling tested and working
- [ ] Balance data verified accurate
- [ ] Transaction data verified accurate
- [ ] API performance <500ms (95th percentile)
- [ ] Sync completes in <2 minutes
- [ ] Documentation updated (API endpoints documented)

---

## Next Phase

**Phase 3: Dashboard UI & Visualization**

**Prerequisites from Phase 2:**
- ✅ API endpoints functional
- ✅ Real-time data available
- ✅ Balance snapshots in database
- ✅ Transaction history available

**What Phase 3 Will Build:**
- Empire overview dashboard
- Entity detail pages
- Charts and visualizations
- Mobile-responsive UI

---

## Notes

- Mercury API keys stored in `.secrets/services/external/.env.mercury`
- Daily briefing cron job already set up (7:30 AM) ✅
- Focus on data accuracy first, performance second
- Keep error messages user-friendly (David will see them)
- Log everything - debugging in production is easier with good logs

---

**Status:** Ready to execute  
**Next Action:** Build `mercury.service.ts`
