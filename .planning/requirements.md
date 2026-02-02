# Empire Portal - Requirements

**Version:** 1.0  
**Last Updated:** February 2, 2026

---

## Functional Requirements

### F1: Financial Data Management

**F1.1: Mercury Account Integration**
- Must connect to 6 Mercury API keys (Kami, David, KBG, MYTE, Cortex, Thryve)
- Must fetch real-time balances for all 30+ accounts
- Must retrieve transaction history (filterable by date, entity, amount)
- Must sync data automatically (daily 7:00 AM CST minimum)
- Must handle API rate limits gracefully
- Must store historical balance snapshots for trending

**F1.2: Multi-Entity Support**
- Must display data grouped by entity (KBG, KFG, MYTE, Cortex, Vizion, Thryve, Summit)
- Must support adding new entities without code changes
- Must track entity hierarchy (KBG as parent)
- Must support entity-specific metadata (industry, status, type)

**F1.3: Transaction Management**
- Must display transaction history across all accounts
- Must support filtering by date range, entity, amount, description
- Must support search functionality
- Must export transactions to CSV/Excel
- Must allow tagging/categorizing transactions (future)

---

### F2: Dashboard & Visualization

**F2.1: Empire Overview Dashboard**
- Must show total cash across all entities
- Must display entity cards with current balances
- Must show 24-hour and 30-day balance changes
- Must display active alerts count
- Must show top 5 recent transactions
- Must render 30-day balance trend chart (stacked area)

**F2.2: Entity-Specific Dashboards**
- Must provide dedicated page per entity (7 entities)
- Must show all accounts for that entity
- Must display monthly metrics (revenue, expenses, profit) when available
- Must show entity-specific goals
- Must render historical charts (balance trends, P&L)

**F2.3: Financial Insights**
- Must calculate and display total empire cash position
- Must show capital flows between entities (Sankey diagram)
- Must highlight pending capital transfers
- Must show profit margin trends
- Must display goal progress (% complete, on-track status)

---

### F3: Alerts & Notifications

**F3.1: Balance Alerts**
- Must alert when account balance < $1,000 threshold (configurable)
- Must alert on significant balance changes (>10% in 24h)
- Must alert on failed transactions

**F3.2: Goal Alerts**
- Must alert when goal is >10% behind schedule
- Must notify on milestone completions
- Must remind of upcoming goal deadlines

**F3.3: Capital Flow Alerts**
- Must alert when capital transfer is due (per FINANCIAL_FLOWS.md)
- Must notify when pending transfers are overdue
- Must confirm when transfers are completed

**F3.4: Delivery Channels**
- Must support WhatsApp notifications (critical only)
- Must support email notifications (daily digest, reports)
- Must support in-app notifications (bell icon)
- Must allow per-alert-type notification preferences

---

### F4: Reporting & Analytics

**F4.1: Automated Reports**
- Must generate daily balance snapshot (7:30 AM CST)
- Must generate weekly per-entity summary (Monday 8 AM)
- Must generate monthly close report (1st of month, 8 AM)
- Must include weather in daily briefing (Bolivar, MO)
- Must deliver reports via configured channels (WhatsApp, email)

**F4.2: On-Demand Reports**
- Must generate custom date range reports
- Must export reports as PDF
- Must export data as CSV/Excel
- Must generate capital flow reports (by month)

**F4.3: Historical Analysis**
- Must show balance trends over time (7/30/90 days)
- Must calculate week-over-week, month-over-month changes
- Must display profit margin trends per entity
- Must show goal progress history

---

### F5: Goal Tracking

**F5.1: Goal Management**
- Must create goals (empire-wide or per-entity)
- Must track target value, current value, unit, period
- Must display progress percentage
- Must show "on track" status (based on timeline)
- Must support phases (Phase 1: Optimize, etc.)

**F5.2: 5-Year Roadmap Integration**
- Must align with MASTER_PLAN.md phases
- Must track key milestones per phase
- Must show current phase status
- Must display upcoming phase transitions

---

### F6: Capital Flow Tracking

**F6.1: Distribution Calculator**
- Must implement profit distribution rules from FINANCIAL_FLOWS.md
- Must calculate monthly distributions: toBusiness, toKFG, toKBG, toReserve, toOwner
- Must show pending distributions by entity
- Must track distribution history

**F6.2: Flow Visualization**
- Must display capital flows as Sankey diagram
- Must show month-by-month flow history
- Must highlight pending vs. completed transfers
- Must calculate total flows by direction (entity → KFG, entity → KBG)

---

### F7: Authentication & Authorization

**F7.1: User Authentication**
- Must use Clerk for authentication
- Must require MFA for all users
- Must support session management (7-day default)
- Must handle logout and session expiration

**F7.2: Role-Based Access Control**
- Must support Owner role (David - full access)
- Must support Admin role (Kami - read + limited write)
- Must support Viewer role (Accountant - read-only)
- Must support Auditor role (CPA - entity-specific read)

**F7.3: Audit Trail**
- Must log all financial data access (who, what, when)
- Must log all actions (create, update, delete)
- Must store IP address and user agent
- Must retain audit logs for 2 years

---

## Non-Functional Requirements

### NF1: Performance

- Page load time: <2 seconds
- API response time: <500ms (95th percentile)
- Real-time data freshness: <5 minutes
- Database query performance: <200ms (95th percentile)
- Support 100 concurrent users (future-proofing)

### NF2: Security

- All data encrypted in transit (HTTPS)
- Database encrypted at rest
- MFA required for all users
- API keys stored in environment variables (never committed)
- Rate limiting on all API endpoints (100 req/15min)
- CSRF protection on all mutations
- SQL injection prevention (Prisma ORM)

### NF3: Reliability

- Uptime: 99.5% (allowing for maintenance)
- Automated backups: Daily to NAS + S3
- Error tracking: Sentry integration
- Graceful degradation if Mercury API unavailable
- Retry logic for failed API calls (3 attempts, exponential backoff)

### NF4: Scalability

- Support 10+ entities without performance degradation
- Support 100+ accounts
- Handle 10,000+ transactions per month
- Database designed for time-series data (balance snapshots)
- Redis caching for frequently accessed data

### NF5: Usability

- Mobile-responsive design (works on phone)
- Intuitive navigation (max 3 clicks to any feature)
- Consistent UI/UX (shadcn/ui + design system)
- Clear error messages with actionable guidance
- Help text for complex features

### NF6: Maintainability

- TypeScript strict mode (type safety)
- Comprehensive documentation (README, ARCHITECTURE, CONTRIBUTING)
- Code linting (ESLint + Prettier)
- Conventional commits (feat, fix, docs, etc.)
- Monorepo structure (shared packages, clear boundaries)

---

## Out of Scope (Explicitly NOT Building)

- ❌ Executing Mercury transfers (approval workflow only)
- ❌ QuickBooks integration (future consideration)
- ❌ Plaid integration for non-Mercury accounts (future)
- ❌ Mobile native app (PWA sufficient for now)
- ❌ Real-time collaboration (single-user for now)
- ❌ Advanced analytics (ML/AI insights - future)
- ❌ Client portal for MYTE/Cortex/Vizion clients (separate project)

---

## Dependencies

**External Services:**
- Mercury Bank API (production tokens acquired)
- Railway (PostgreSQL + Redis + API hosting)
- Vercel (frontend hosting)
- Clerk (authentication)
- Resend (email)
- Cloudflare (DNS, domain: portal.keystonebg.us)
- Synology NAS (backups)

**Data Sources:**
- Mercury API (real-time balances, transactions)
- Railway PostgreSQL (historical data, metrics, goals)
- MASTER_PLAN.md (5-year roadmap, phases)
- FINANCIAL_FLOWS.md (distribution rules)

---

## Acceptance Criteria

**Phase 2 (Mercury Integration):**
- [ ] Can fetch balances from all 6 Mercury accounts
- [ ] Can retrieve transaction history with filters
- [ ] Data syncs automatically every 5 minutes
- [ ] Error handling for API failures (graceful, logged)

**Phase 3 (Dashboard UI):**
- [ ] Empire overview shows all entities with current balances
- [ ] Entity pages display account details
- [ ] 30-day trend chart renders correctly
- [ ] Mobile-responsive on iPhone/Android

**Phase 4 (Automation):**
- [ ] Daily briefing sends at 7:30 AM CST via WhatsApp
- [ ] Weekly reports generate and email
- [ ] Low balance alerts trigger (<$1K threshold)

**Phase 5 (Auth & Polish):**
- [ ] Clerk MFA login works
- [ ] Audit log captures all actions
- [ ] Can deploy to production (portal.keystonebg.us)
- [ ] All tests passing (API endpoints)

---

## Change Log

- **2026-02-02:** Initial requirements document created
