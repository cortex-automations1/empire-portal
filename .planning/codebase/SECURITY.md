# Security Practices

**Analysis Date:** February 2, 2026  
**Codebase:** Empire Portal (Financial Application)  
**Risk Level:** HIGH (Real financial data, 30+ bank accounts)

---

## Security Classification

**Data Sensitivity:** 🔴 **CRITICAL**

**Protected Data:**
- Real-time bank balances ($10K+ total)
- Transaction history (dates, amounts, descriptions)
- Account numbers and routing numbers
- Mercury API keys (full read access to bank accounts)
- Business financial metrics (revenue, expenses, profit)
- Strategic goals and capital flows

**Threat Model:**
- External attackers (data breach, API abuse)
- Credential theft (API keys, database passwords)
- Insider threats (unauthorized access by future users)
- Accidental exposure (logging secrets, committing keys)

---

## Security Principles

### 1. Defense in Depth
Multiple layers of security (auth, rate limiting, validation, audit logs)

### 2. Least Privilege
Users/services get minimum permissions needed

### 3. Secure by Default
New code must pass security checklist before merge

### 4. Audit Everything
All financial data access logged with user ID, timestamp, IP

### 5. Fail Securely
Errors never expose sensitive data or internal details

---

## Secret Management

### Rule: **NEVER commit secrets to Git**

**Secrets Include:**
- API keys (Mercury, Clerk, Cloudflare, etc.)
- Database passwords
- JWT signing keys
- Encryption keys
- OAuth client secrets

---

### Storage Locations

**Production Secrets:**
- Railway environment variables (backend, workers, database)
- Vercel environment variables (frontend, API routes)
- Accessed via `process.env.VARIABLE_NAME`

**Local Development:**
- `.env.local` (gitignored, never committed)
- Located at package root: `apps/api/.env.local`, `apps/web/.env.local`
- Copy from `.env.example` and fill in values

**Master Copy:**
- `C:\users\davep\.secrets\services\external\.env.mercury` (6 API keys)
- `C:\users\davep\.secrets\services\external\.env.cloudflare`
- Backed up to PerezNAS1 (encrypted)

---

### Naming Convention

```bash
# Mercury API keys (one per entity)
MERCURY_KAMI_API_KEY=secret-token:mercury_production_wma_...
MERCURY_DAVID_API_KEY=secret-token:mercury_production_wma_...
MERCURY_KBG_API_KEY=secret-token:mercury_production_wma_...
MERCURY_MYTE_API_KEY=secret-token:mercury_production_wma_...
MERCURY_CORTEX_API_KEY=secret-token:mercury_production_wma_...
MERCURY_THRYVE_API_KEY=secret-token:mercury_production_wma_...

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Phase 5)
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Other services
CLOUDFLARE_API_TOKEN=...
RESEND_API_KEY=...
```

---

### Access Patterns

**✅ CORRECT:**
```typescript
// Load from environment variable
const apiKey = process.env.MERCURY_MYTE_API_KEY;

if (!apiKey) {
  throw new Error('MERCURY_MYTE_API_KEY is not set');
}

// Use in API call
const response = await fetch('https://api.mercury.com/api/v1/accounts', {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

**❌ WRONG:**
```typescript
// NEVER hardcode secrets
const apiKey = 'secret-token:mercury_production_wma_ABC123';

// NEVER commit .env files
// .env should be in .gitignore
```

---

### Logging Secrets

**✅ SAFE to log:**
```typescript
// Mask secrets (show first 8 chars only)
logger.info({ apiKey: apiKey.slice(0, 8) + '...' }, 'Using Mercury API key');

// Log that secret exists without value
logger.debug({ hasApiKey: !!apiKey }, 'Environment check');
```

**❌ NEVER log:**
```typescript
// Full API key in logs
logger.info({ apiKey }, 'API request'); // ← SECURITY VIOLATION

// Full database URL
logger.error({ DATABASE_URL }, 'Connection failed'); // ← EXPOSES PASSWORD

// Full request headers (may contain auth tokens)
logger.debug({ headers: request.headers }, 'Request received');
```

---

### Key Rotation

**Mercury API Keys:**
- Rotate every 90 days (calendar reminder set)
- Generate new key in Mercury dashboard
- Update Railway/Vercel environment variables
- Update `.secrets` master copy
- Test all services still working
- Delete old key in Mercury dashboard

**Database Password:**
- Railway auto-rotates (managed service)
- If manually rotating: Update DATABASE_URL everywhere simultaneously

---

## API Security

### Rate Limiting

**Why:** Prevent abuse, DDoS attacks, brute force attempts

**Implementation:** Express middleware (`apps/api/src/middleware/rate-limit.ts`)

```typescript
import rateLimit from 'express-rate-limit';

// Global rate limit
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT' } },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints (future)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 min
  skipSuccessfulRequests: true,
});
```

**Apply to routes:**
```typescript
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter); // Phase 5
```

---

### CORS (Cross-Origin Resource Sharing)

**Why:** Prevent unauthorized domains from calling our API

**Implementation:** Express middleware (`apps/api/src/middleware/cors.ts`)

```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://portal.keystonebg.us', // Production
  'http://localhost:3000', // Local dev
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies (for Clerk sessions)
});
```

---

### Input Validation

**Why:** Prevent SQL injection, XSS, command injection

**Strategy:** Validate all inputs at API boundary using Zod schemas

**Implementation:**

```typescript
import { z } from 'zod';

// Define schema
const BalanceQuerySchema = z.object({
  entityId: z.string().min(1).max(50).regex(/^[a-z-]+$/), // Only lowercase letters and dashes
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Validate in route handler
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = {
      entityId: url.searchParams.get('entityId'),
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
    };
    
    // Validate (throws ZodError if invalid)
    const validated = BalanceQuerySchema.parse(params);
    
    // Safe to use validated data
    const balances = await getBalances(validated);
    return Response.json({ success: true, data: balances });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

**What to Validate:**
- Query parameters (GET requests)
- Request body (POST/PUT requests)
- Path parameters (entity IDs, account IDs)
- File uploads (future)

---

### SQL Injection Prevention

**Why:** Attacker could read/modify database by injecting SQL

**Protection:** Prisma ORM (parameterized queries)

**✅ SAFE (Prisma):**
```typescript
// Prisma automatically parameterizes
const accounts = await prisma.account.findMany({
  where: { entityId: userInput }, // ← Safe (parameterized)
});
```

**❌ DANGEROUS (Raw SQL):**
```typescript
// NEVER use template strings with user input
const query = `SELECT * FROM accounts WHERE entity_id = '${userInput}'`; // ← SQL INJECTION RISK
await prisma.$queryRaw(query);
```

**If raw SQL needed:**
```typescript
// Use Prisma's parameterized raw query
await prisma.$queryRaw`SELECT * FROM accounts WHERE entity_id = ${userInput}`;
// ← Safe (parameterized)
```

---

### XSS (Cross-Site Scripting) Prevention

**Why:** Attacker could inject malicious JavaScript

**Protection:** React auto-escapes (Next.js)

**✅ SAFE (React):**
```tsx
// React automatically escapes
<div>{userInput}</div> // ← Safe
```

**❌ DANGEROUS:**
```tsx
// NEVER use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // ← XSS RISK
```

**If HTML needed:**
```typescript
import DOMPurify from 'dompurify';

// Sanitize before rendering
const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

---

## Authentication & Authorization

### Phase 5: Clerk Integration

**Authentication:** Clerk handles login, MFA, session management

**Authorization:** Role-based access control (RBAC)

**Roles:**
- **Owner** (David): Full access to all entities, all operations
- **Admin** (Kami): Read all, write limited (no delete, no config changes)
- **Viewer** (Accountant): Read-only, all entities
- **Auditor** (CPA): Read-only, specific entity only

---

### Middleware (Phase 5)

**File:** `apps/api/src/middleware/auth.ts`

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided', code: 'AUTH_REQUIRED' }
      });
    }
    
    // Verify token with Clerk
    const session = await clerkClient.sessions.verifySession(token);
    
    // Attach user to request
    req.user = {
      id: session.userId,
      role: session.publicMetadata.role || 'viewer',
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'AUTH_INVALID' }
    });
  }
}

// Role check middleware
export function requireRole(allowedRoles: string[]) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions', code: 'FORBIDDEN' }
      });
    }
    next();
  };
}
```

**Usage:**
```typescript
// Protect route
app.get('/api/mercury/balances', authMiddleware, async (req, res) => {
  // req.user is available
});

// Require specific role
app.delete('/api/accounts/:id', authMiddleware, requireRole(['owner']), async (req, res) => {
  // Only owner can delete
});
```

---

### Session Security

**Settings:**
- Session expiration: 7 days (Clerk default)
- Require MFA for all users
- Refresh token rotation (Clerk handles)
- Logout clears session immediately

---

## Audit Logging

### Why
- Track who accessed what financial data (compliance)
- Detect suspicious activity (unauthorized access attempts)
- Debug issues (trace user actions leading to error)
- Accountability (prove who made changes)

---

### What to Log

**All Financial Data Access:**
- Balance queries (who, which entity, which accounts, when)
- Transaction history queries
- Report generation
- Alert creation/dismissal

**All Mutations:**
- Goal creation/update/deletion
- Capital flow entries
- Entity configuration changes
- User management (future)

**Security Events:**
- Login attempts (successful and failed)
- Permission denials (user tried to access forbidden resource)
- API key usage (which key, which endpoint, timestamp)

---

### Audit Log Schema

**Table:** `AuditLog` (Prisma schema already defined)

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?  // Clerk user ID
  action    String   // "balance.view", "goal.create", "auth.login"
  resource  String?  // "entity:myte", "account:12345"
  details   Json?    // Additional context
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

---

### Logging Implementation

**Helper Function:** `apps/api/src/utils/audit.ts`

```typescript
import { prisma } from '@empire/database';

export async function auditLog({
  userId,
  action,
  resource,
  details,
  request,
}: {
  userId?: string;
  action: string;
  resource?: string;
  details?: Record<string, unknown>;
  request: Request;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      details,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    },
  });
}
```

**Usage:**
```typescript
// In API route
export async function GET(request: Request) {
  const balances = await getBalances(entityId);
  
  // Log access
  await auditLog({
    userId: request.user?.id,
    action: 'balance.view',
    resource: `entity:${entityId}`,
    details: { accountCount: balances.length },
    request,
  });
  
  return Response.json({ success: true, data: balances });
}
```

---

### Retention Policy

**Audit logs:**
- Retain for 2 years (compliance requirement)
- Archive to S3/NAS after 90 days (cheaper storage)
- Never delete (financial audit trail)

---

## Data Protection

### Encryption in Transit

**✅ HTTPS Enforced:**
- Vercel: Auto-SSL (Let's Encrypt)
- Railway: Auto-SSL
- Cloudflare: TLS 1.3

**Configuration:**
```javascript
// Next.js - Force HTTPS redirect (middleware)
export function middleware(request) {
  if (request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`);
  }
}
```

---

### Encryption at Rest

**✅ Database Encryption:**
- Railway PostgreSQL: AES-256 encryption at rest (built-in)
- No additional configuration needed

**Field-Level Encryption:**
- Not needed for MVP (database encryption sufficient)
- Future: Consider for account numbers if needed

---

### Data Masking

**Account Numbers:**
- Never show full account number in UI
- Mask: `****1234` (last 4 digits only)

```typescript
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}
```

**Balances:**
- Show full balance to authorized users only
- Hide from screenshots (CSS: `user-select: none` on sensitive fields)

---

## Mercury API Security

### API Key Handling

**Storage:**
- Environment variables only
- One key per entity (6 total)
- Never log full key (mask to first 8 chars)

**Usage:**
```typescript
// Always validate key exists before using
const apiKey = process.env.MERCURY_MYTE_API_KEY;
if (!apiKey) {
  throw new Error('Mercury API key not configured for MYTE');
}

// Include in Authorization header
const response = await fetch('https://api.mercury.com/api/v1/accounts', {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

---

### Rate Limit Compliance

**Mercury Limits:**
- 100 requests per minute per token
- Exceeding triggers 429 response

**Our Strategy:**
- Batch requests where possible
- Cache balance data (5 min TTL)
- Sync once per day (7 AM), not on every page load
- Retry with exponential backoff on 429:
  ```typescript
  async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await sleep(retryAfter * 1000);
        continue;
      }
      
      return response;
    }
    throw new Error('Max retries exceeded');
  }
  ```

---

### Error Handling

**Never expose Mercury errors to users:**

**❌ BAD:**
```typescript
// Don't leak internal errors
return res.status(500).json({ error: mercuryError.message });
// Example: "Invalid API key: token expired"
// ← Reveals we're using Mercury API, token issues
```

**✅ GOOD:**
```typescript
// Generic error to user
return res.status(500).json({ 
  success: false, 
  error: { message: 'Unable to fetch balance data' } 
});

// Log detailed error internally
logger.error({ 
  error: mercuryError, 
  entity: 'MYTE', 
  endpoint: '/accounts' 
}, 'Mercury API error');
```

---

## Deployment Security

### Environment Variables

**Vercel (Frontend):**
- Add in Vercel project settings → Environment Variables
- Prefix public vars with `NEXT_PUBLIC_` (exposed to browser)
- Private vars never exposed to browser

**Railway (Backend, Workers):**
- Add in Railway project → Variables
- All variables private (server-side only)
- Use Railway CLI: `railway variables set KEY=value`

---

### Pre-Deployment Checklist

Before deploying to production:

- [ ] No secrets in `.env` files committed to Git
- [ ] All secrets added to Vercel/Railway environment variables
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] CORS configured (whitelist portal.keystonebg.us only)
- [ ] Rate limiting enabled (100 req/15 min)
- [ ] Input validation on all API endpoints (Zod schemas)
- [ ] Error messages generic (no internal details leaked)
- [ ] Audit logging functional (test write to AuditLog table)
- [ ] Database backups enabled (Railway auto-backup + NAS)
- [ ] Mercury API keys rotated (if >90 days old)

---

## Security Testing

### Manual Security Tests (Phase 7)

**Test 1: Secret Exposure**
- [ ] Search codebase for hardcoded secrets: `git grep -E '(secret|password|key).*=.*[a-zA-Z0-9]{20,}'`
- [ ] Check `.env` files not in Git: `git log --all -- .env`
- [ ] Verify environment variables loaded: `console.log(!!process.env.MERCURY_MYTE_API_KEY)`

**Test 2: API Security**
- [ ] Try accessing API without auth (should 401)
- [ ] Try exceeding rate limit (should 429 after 100 req)
- [ ] Try CORS from unauthorized domain (should block)
- [ ] Try SQL injection in query param: `?entityId=' OR '1'='1` (should validate/reject)

**Test 3: Error Messages**
- [ ] Trigger API error (invalid key), check response doesn't leak details
- [ ] Check logs don't contain full API keys

**Test 4: Audit Logging**
- [ ] View balance data, check AuditLog entry created
- [ ] Verify userId, action, resource, ipAddress captured

---

## Incident Response

### If Secret Exposed

**Immediate Actions:**
1. **Rotate compromised secret** (generate new Mercury API key, database password, etc.)
2. **Update all deployments** (Vercel, Railway) with new secret
3. **Revoke old secret** (delete in Mercury dashboard, invalidate old password)
4. **Check audit logs** (did attacker use the exposed secret?)
5. **Document incident** (what was exposed, how, when, what we did)

**Future Prevention:**
- Add secret scanning (GitHub Secret Scanning, git-secrets pre-commit hook)
- Regular audits (monthly review of environment variables)

---

## Compliance & Best Practices

### Financial Data Compliance

**SOC 2 / PCI DSS (Future):**
- Audit trail (all data access logged)
- Access control (RBAC with Clerk)
- Encryption (in transit: HTTPS, at rest: Railway)
- Backup and recovery (daily backups to NAS)

**Current State:**
- Not formally certified (MVP - single user)
- Following best practices (audit logs, encryption, MFA)
- Ready for audit when scaling to multiple users

---

### Secure Coding Checklist

Before merging any code:

- [ ] No hardcoded secrets (use environment variables)
- [ ] Input validation on all external inputs (Zod schemas)
- [ ] Error handling doesn't leak internal details
- [ ] SQL queries use Prisma (parameterized)
- [ ] No `dangerouslySetInnerHTML` with user input
- [ ] Rate limiting on API endpoints
- [ ] Audit log for financial data access
- [ ] Secrets masked in logs (first 8 chars only)
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS whitelist configured

---

## Security Contacts

**Report Security Issues:**
- Email: david@cortexautomations.ai
- Slack: DM David in Cortex Automations workspace
- WhatsApp: +18017876637

**Do NOT:**
- Open public GitHub issue for security vulnerabilities
- Share details on Discord/public channels

---

*Security practices documented: 2026-02-02*  
*Update when new threats identified or controls added*
