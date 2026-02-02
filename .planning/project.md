# Empire Portal - Project Overview

**Version:** 1.0  
**Started:** February 1, 2026  
**Status:** Phase 1 Complete, Phase 2 In Progress  
**Owner:** David Perez / Keystone Business Group  
**Developer:** Milo (OpenClaw AI)

---

## Mission

Build a unified command center for managing Keystone Business Group's 6-entity business empire with real-time financial intelligence, automated reporting, and strategic goal tracking.

## Problem Statement

**Current Pain Points:**
- Manual tracking across 30+ Mercury bank accounts
- No consolidated view of empire finances
- Time-consuming monthly reporting (10+ hours/month)
- Difficult to track capital flows between entities
- No automated alerts for low balances or missed goals
- Strategic planning disconnected from financial reality

**Impact:**
- Delayed decision-making due to stale data
- Risk of overdrafts or missed payments
- Manual effort that doesn't scale
- No clear visibility into 5-year roadmap progress

## Solution

A real-time financial command center that:
- ✅ Consolidates all 6 entities and 30 accounts in one dashboard
- ✅ Provides automated daily/weekly/monthly reports
- ✅ Tracks capital flows per FINANCIAL_FLOWS.md
- ✅ Monitors 5-year strategic goals (MASTER_PLAN.md)
- ✅ Sends proactive alerts (low balances, pending transfers)
- ✅ Enables data-driven strategic decisions

## Success Metrics

**Launch (Feb 28, 2026):**
- [ ] David checks portal daily instead of Mercury directly
- [ ] All 30 accounts visible in real-time
- [ ] Daily automated sync running
- [ ] Critical alerts delivered via WhatsApp

**Month 1 (Mar 31, 2026):**
- [ ] 10+ hours/month saved vs manual tracking
- [ ] All entities submitting monthly reports via portal
- [ ] Capital flow tracking operational
- [ ] Goals tracked and progress visible

**Long-term:**
- [ ] Portal is single source of truth for empire
- [ ] 80%+ of reports auto-generated
- [ ] Data-driven strategic decisions
- [ ] Ready to scale (add entities, users, features)

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Tremor  
**Backend:** Express, TypeScript, Prisma ORM  
**Database:** PostgreSQL 16 (Railway)  
**Cache:** Redis 7 (Railway)  
**Auth:** Clerk (MFA, audit logs)  
**Email:** Resend + React Email  
**Hosting:** Vercel (frontend) + Railway (backend)  
**Repository:** Turborepo monorepo with pnpm

## Key Constraints

- **Security:** Financial data - MFA required, audit trail mandatory
- **Cost:** ~$25-30/month budget (Railway + Vercel free tiers)
- **Performance:** Real-time balances, <5 min sync delay
- **Scale:** Must support 10+ entities, 50+ accounts in future
- **Mobile:** Responsive design required (David checks on phone)

## Stakeholders

**Primary User:** David Perez (Owner, full access)  
**Secondary Users (Future):** Kami Perez (Admin), Accountant (Viewer), CPA (Auditor)  
**Integrated Systems:** Mercury Bank (30 accounts), Synology NAS, Railway, Cloudflare

## Project Links

- **Repository:** https://github.com/cortex-automations1/empire-portal
- **Live Site:** https://portal.keystonebg.us (deploying)
- **Railway:** https://railway.com/project/716078ba-4cea-496b-bf5c-212babe78904
- **Spec:** `C:\Dev\projects\Keystone Business Group\Portal\SPEC.md`
- **Master Plan:** `C:\Dev\projects\Keystone Business Group\MASTER_PLAN.md`

## Current Phase

**Phase 2: Mercury Integration & Core API**  
Building the Mercury service layer and core API endpoints for balance fetching and transaction history.

See [roadmap.md](.planning/roadmap.md) for full phase breakdown.
