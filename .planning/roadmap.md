# Empire Portal - Development Roadmap

**Last Updated:** February 2, 2026  
**Target Launch:** February 28, 2026

---

## Phase Overview

| Phase | Name | Status | Duration | Target Complete |
|-------|------|--------|----------|-----------------|
| 1 | Foundation | ✅ Complete | 1 day | Feb 1, 2026 |
| 2 | Mercury Integration & Core API | 🔄 In Progress | 3 days | Feb 5, 2026 |
| 3 | Dashboard UI & Visualization | ⏳ Planned | 5 days | Feb 10, 2026 |
| 4 | Automation & Reports | ⏳ Planned | 4 days | Feb 14, 2026 |
| 5 | Authentication & Security | ⏳ Planned | 3 days | Feb 17, 2026 |
| 6 | Goal Tracking & Capital Flows | ⏳ Planned | 5 days | Feb 22, 2026 |
| 7 | Polish & Testing | ⏳ Planned | 6 days | Feb 28, 2026 |

**Total Estimated:** 27 days  
**Launch Date:** February 28, 2026

---

## Phase 1: Foundation ✅ COMPLETE

**Completed:** February 1, 2026  
**Duration:** 1 day

### Objectives
- ✅ Set up monorepo structure
- ✅ Configure shared packages
- ✅ Deploy database
- ✅ Create initial documentation

### Deliverables
- ✅ GitHub repository created
- ✅ Turborepo monorepo with pnpm workspaces
- ✅ Packages: shared, database, config
- ✅ Prisma schema (10 tables)
- ✅ Railway PostgreSQL deployed (hopper.proxy.rlwy.net)
- ✅ Basic Next.js app scaffolded
- ✅ Documentation (README, ARCHITECTURE, QUICKSTART, CONTRIBUTING)

### Verification
- ✅ `pnpm install` works from root
- ✅ Database schema pushed to Railway
- ✅ Prisma client generated
- ✅ TypeScript compiles without errors

---

## Phase 2: Mercury Integration & Core API 🔄 IN PROGRESS

**Started:** February 2, 2026  
**Target:** February 5, 2026  
**Status:** 20% complete

### Objectives
- Build Mercury service layer
- Create core API endpoints
- Implement data sync logic
- Set up cron workers

### Tasks

**Backend (apps/api):**
- [ ] Create `src/services/mercury.service.ts`
  - [ ] Function: `getAccounts()` - List all accounts for an entity
  - [ ] Function: `getBalance(accountId)` - Get current balance
  - [ ] Function: `getTransactions(accountId, filters)` - Fetch transaction history
  - [ ] Error handling and retry logic
- [ ] Create `src/routes/mercury.routes.ts`
  - [ ] `GET /api/mercury/balances` - All balances
  - [ ] `GET /api/mercury/balances/:entity` - Entity-specific
  - [ ] `GET /api/mercury/transactions` - Filterable transactions
  - [ ] `POST /api/mercury/sync` - Manual sync trigger
- [ ] Create `src/middleware/auth.ts` - Clerk verification
- [ ] Create `src/middleware/error.ts` - Error handling
- [ ] Create `src/middleware/rateLimit.ts` - Rate limiting

**Database:**
- [ ] Seed entities (KBG, KFG, MYTE, Cortex, Vizion, Thryve, Summit)
- [ ] Seed accounts from Mercury API
- [ ] First balance snapshot

**Workers (apps/workers):**
- [ ] Create `src/jobs/daily-sync.ts` - Mercury sync job
- [ ] Scheduler setup (7:00 AM CST)
- [ ] Deploy to Railway

**Testing:**
- [ ] Test Mercury API calls with real tokens
- [ ] Verify balance data accuracy
- [ ] Test error handling (invalid tokens, network failures)

### Deliverables
- [ ] Mercury service layer functional
- [ ] 4 API endpoints working
- [ ] Daily sync cron job running
- [ ] Error logs in Railway

### Acceptance Criteria
- [ ] Can fetch balances for all 6 entities via API
- [ ] Transaction history retrieves correctly
- [ ] Daily sync runs at 7 AM without errors
- [ ] API returns proper error messages on failures

### User Setup Required
- None (Mercury API keys already configured)

---

## Phase 3: Dashboard UI & Visualization ⏳ PLANNED

**Target Start:** February 5, 2026  
**Target Complete:** February 10, 2026

### Objectives
- Build empire overview dashboard
- Create entity-specific pages
- Add charts and visualizations
- Make mobile-responsive

### Tasks

**UI Components (apps/web/components/features):**
- [ ] `EntityCard.tsx` - Business unit summary card
- [ ] `BalanceCard.tsx` - Account balance display
- [ ] `TransactionList.tsx` - Transaction table with filters
- [ ] `CapitalFlowChart.tsx` - Sankey diagram
- [ ] `TrendChart.tsx` - 30-day balance trend (Tremor)
- [ ] `AlertBanner.tsx` - Alert display component
- [ ] `MetricCard.tsx` - KPI display

**Pages (apps/web/app/(dashboard)):**
- [ ] `/` - Empire overview
  - [ ] Total cash display
  - [ ] Entity grid (6 cards)
  - [ ] 30-day trend chart
  - [ ] Recent activity feed
  - [ ] Active alerts
- [ ] `/financial` - Financial dashboard
  - [ ] All accounts table
  - [ ] Transaction search/filter
  - [ ] Capital flows visualization
- [ ] `/businesses/[entity]` - Entity detail pages (7 pages)
  - [ ] Account list
  - [ ] Transaction history
  - [ ] Monthly metrics (when available)
  - [ ] Entity-specific goals

**API Integration:**
- [ ] Fetch balances from `/api/mercury/balances`
- [ ] Fetch transactions from `/api/mercury/transactions`
- [ ] Real-time updates (poll every 5 minutes)
- [ ] Loading states and error handling

**Styling:**
- [ ] Apply design system (brand blue, gray scale)
- [ ] Mobile-responsive layouts
- [ ] Dark mode support (optional)

### Deliverables
- [ ] Functional empire overview dashboard
- [ ] 7 entity detail pages
- [ ] Financial dashboard with charts
- [ ] Mobile-responsive UI

### Acceptance Criteria
- [ ] Dashboard loads in <2 seconds
- [ ] All 30 accounts visible
- [ ] Charts render correctly
- [ ] Works on mobile (iPhone/Android)
- [ ] No TypeScript errors

---

## Phase 4: Automation & Reports ⏳ PLANNED

**Target Start:** February 10, 2026  
**Target Complete:** February 14, 2026

### Objectives
- Automate daily/weekly/monthly reports
- Set up alert system
- Integrate WhatsApp/Email notifications
- Build report generation

### Tasks

**Report Generation:**
- [ ] `src/services/reports.service.ts`
  - [ ] `generateDailyBriefing()` - Morning summary
  - [ ] `generateWeeklyReport()` - Per-entity summary
  - [ ] `generateMonthlyClose()` - Full P&L + capital flows
- [ ] PDF generation (React-PDF)
- [ ] NAS sync integration (save to PerezNAS1)

**Alert System:**
- [ ] `src/services/alerts.service.ts`
  - [ ] Check low balances (threshold: $1,000)
  - [ ] Check goal progress (>10% behind = alert)
  - [ ] Check pending capital transfers
- [ ] Alert rules configuration (database)
- [ ] Alert delivery (WhatsApp, Email)

**Notification Integration:**
- [ ] Resend email setup
  - [ ] Daily digest email template
  - [ ] Weekly report email template
  - [ ] Alert email template
- [ ] WhatsApp integration (OpenClaw message tool)
  - [ ] Critical alerts only
  - [ ] Format for mobile readability

**Cron Jobs:**
- [ ] Daily briefing (7:30 AM CST) - Already set up ✅
- [ ] Weekly report (Monday 8 AM)
- [ ] Monthly close (1st of month, 8 AM)
- [ ] Alert check (hourly)

### Deliverables
- [ ] Daily briefing running (already done ✅)
- [ ] Weekly/monthly reports automated
- [ ] Alert system functional
- [ ] Email integration working

### Acceptance Criteria
- [ ] Daily briefing arrives at 7:30 AM via WhatsApp
- [ ] Weekly report emails on Monday
- [ ] Low balance alert triggers correctly
- [ ] Reports include weather (Bolivar, MO)

---

## Phase 5: Authentication & Security ⏳ PLANNED

**Target Start:** February 14, 2026  
**Target Complete:** February 17, 2026

### Objectives
- Implement Clerk authentication
- Add role-based access control
- Create audit logging
- Deploy to production

### Tasks

**Authentication (Clerk):**
- [ ] Set up Clerk project
- [ ] Add Clerk to Next.js app
  - [ ] `app/(auth)/sign-in` page
  - [ ] `app/(auth)/sign-up` page
  - [ ] Middleware for protected routes
- [ ] Configure MFA (required)
- [ ] Session management (7-day expiry)

**Authorization:**
- [ ] Implement role middleware
  - [ ] Owner: Full access (David)
  - [ ] Admin: Read + limited write (Kami - future)
  - [ ] Viewer: Read-only (Accountant - future)
  - [ ] Auditor: Entity-specific (CPA - future)
- [ ] Protect API endpoints with role checks
- [ ] UI permission checks (hide actions user can't perform)

**Audit Logging:**
- [ ] Audit log middleware
  - [ ] Log all financial data access
  - [ ] Log all mutations (create, update, delete)
  - [ ] Store IP address, user agent
- [ ] Audit log UI (Owner/Admin only)
  - [ ] Search/filter audit logs
  - [ ] Export audit trail

**Deployment:**
- [ ] Fix Vercel monorepo configuration
- [ ] Deploy frontend to portal.keystonebg.us
- [ ] Deploy backend to Railway
- [ ] Set environment variables (production)
- [ ] Verify DNS and SSL

### Deliverables
- [ ] Clerk authentication working
- [ ] Role-based access control
- [ ] Audit trail functional
- [ ] Production deployment live

### Acceptance Criteria
- [ ] Can log in with MFA
- [ ] Unauthorized users cannot access financial data
- [ ] Audit log captures all actions
- [ ] portal.keystonebg.us loads successfully

### User Setup Required
- [ ] Create Clerk account
- [ ] Get Clerk API keys
- [ ] Add keys to Vercel/Railway environment variables

---

## Phase 6: Goal Tracking & Capital Flows ⏳ PLANNED

**Target Start:** February 17, 2026  
**Target Complete:** February 22, 2026

### Objectives
- Build goal tracking system
- Implement capital flow calculator
- Create 5-year roadmap integration
- Add Sankey diagram visualization

### Tasks

**Goal System:**
- [ ] Goal CRUD API
  - [ ] `POST /api/goals` - Create goal
  - [ ] `GET /api/goals` - List goals (filterable)
  - [ ] `PUT /api/goals/:id` - Update goal
  - [ ] `PUT /api/goals/:id/progress` - Update current value
  - [ ] `DELETE /api/goals/:id` - Archive goal
- [ ] Goal tracking UI
  - [ ] `/strategic/goals` page
  - [ ] Create/edit goal form
  - [ ] Progress bars and status
  - [ ] "On track" calculation
  - [ ] Phase alignment (MASTER_PLAN.md)

**Capital Flow System:**
- [ ] Capital flow calculator
  - [ ] Implement FINANCIAL_FLOWS.md rules
  - [ ] Calculate monthly distributions per entity
  - [ ] Track pending vs. completed transfers
- [ ] Capital flow UI
  - [ ] `/financial/flows` page
  - [ ] Sankey diagram (Tremor or D3)
  - [ ] Pending transfers list
  - [ ] Historical flows by month

**Strategic Planning:**
- [ ] `/strategic/planning` page
  - [ ] Display MASTER_PLAN.md phases
  - [ ] Show current phase status
  - [ ] Milestone tracking
  - [ ] Phase transition notifications

### Deliverables
- [ ] Goal tracking fully functional
- [ ] Capital flow calculator working
- [ ] Sankey diagram rendering
- [ ] Strategic planning page

### Acceptance Criteria
- [ ] Can create empire-wide and per-entity goals
- [ ] Progress updates automatically from financial data
- [ ] Capital flow calculations match FINANCIAL_FLOWS.md
- [ ] Sankey diagram shows entity → KFG/KBG flows

---

## Phase 7: Polish & Testing ⏳ PLANNED

**Target Start:** February 22, 2026  
**Target Complete:** February 28, 2026

### Objectives
- Complete end-to-end testing
- Fix bugs and polish UI
- Optimize performance
- Write user documentation

### Tasks

**Testing:**
- [ ] API endpoint tests (all routes)
- [ ] Database query performance testing
- [ ] Mercury API error handling (simulate failures)
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Mobile testing (iPhone, Android)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

**Bug Fixes:**
- [ ] Fix all critical bugs
- [ ] Address UI/UX issues
- [ ] Resolve performance bottlenecks
- [ ] Fix TypeScript errors/warnings

**Performance Optimization:**
- [ ] Add Redis caching for frequent queries
- [ ] Optimize database queries (indexes)
- [ ] Lazy load charts/heavy components
- [ ] Image optimization
- [ ] Bundle size optimization

**Documentation:**
- [ ] User guide (how to use portal)
  - [ ] Login and navigation
  - [ ] Reading financial data
  - [ ] Understanding alerts
  - [ ] Generating reports
- [ ] Admin guide (future users)
  - [ ] Creating goals
  - [ ] Submitting monthly reports
  - [ ] Managing alerts
- [ ] Update README with deployment instructions
- [ ] API documentation (endpoints, examples)

**Final Checklist:**
- [ ] All acceptance criteria met
- [ ] No critical bugs
- [ ] Production deployment stable
- [ ] David successfully using portal daily
- [ ] Daily briefing arriving reliably

### Deliverables
- [ ] Fully tested application
- [ ] All bugs resolved
- [ ] Complete documentation
- [ ] Production-ready

### Acceptance Criteria
- [ ] All API tests passing
- [ ] Page load <2 seconds
- [ ] No console errors
- [ ] Mobile-responsive verified
- [ ] David confirms: "This is ready for daily use"

---

## Launch Plan (February 28, 2026)

**Pre-Launch (Feb 27):**
- [ ] Final production deploy
- [ ] Run full smoke tests
- [ ] Verify all cron jobs scheduled
- [ ] Check all environment variables
- [ ] Backup database

**Launch Day (Feb 28):**
- [ ] Announce to David: "Portal is live!"
- [ ] Monitor logs for errors
- [ ] Watch first daily briefing delivery (Feb 29, 7:30 AM)
- [ ] Collect feedback

**Post-Launch (Week 1):**
- [ ] Daily check-ins for issues
- [ ] Quick bug fixes if needed
- [ ] Gather usage feedback
- [ ] Plan Phase 8 enhancements

---

## Future Phases (Post-Launch)

**Phase 8: Email Integration** (March)
- Microsoft Graph API
- Email triage and summaries
- Draft responses

**Phase 9: Multi-User Support** (March)
- Add Kami as Admin user
- Invite accountant as Viewer
- User management UI

**Phase 10: Advanced Analytics** (April)
- Predictive insights
- AI-powered recommendations
- Cross-entity analysis

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Mercury API rate limits hit | High | Medium | Implement caching, reduce sync frequency if needed |
| Vercel monorepo deploy fails | High | Low | Test thoroughly, use Railway for full stack as backup |
| Missing Clerk features | Medium | Low | Evaluate auth alternatives (NextAuth) if needed |
| David too busy to test | Medium | Medium | Build incrementally, show progress daily |
| Database performance issues | High | Low | Index optimization, query monitoring |
| Security vulnerability | Critical | Low | Regular security audits, Sentry monitoring |

---

## Change Log

- **2026-02-02:** Roadmap created with 7 phases
- **2026-02-01:** Phase 1 completed (Foundation)
