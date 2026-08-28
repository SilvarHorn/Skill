# Project: Skill Bridge Verified Reputation, Rating, Feedback, Trust & Review System

## Architecture
The Skill Bridge Reputation & Trust System is built on a modular, dual-engine hybrid architecture:
1. **Persistence Layer**:
   - **PostgreSQL / Neon with Drizzle ORM**: Relational models for production deployments.
   - **Atomic In-Memory & JSON DB Fallback (`lib/db.js`, `db/index.js`)**: File-backed atomic persistence and mock query builder for local execution and zero-dependency test environments.
2. **Security & Identity Engine**:
   - **Better Auth Integration**: Zero-trust server session validation, role immutability (`STUDENT`, `INDUSTRY`, `INSTITUTE`, `ADMIN`), and tenant IDOR checks via `lib/auth-guard.js`.
   - **Eligibility Engine (`lib/rating-engine.js`)**: Evaluates interaction linkage, lifecycle stage, duplicate submission locks, self-rating prevention, and rating deadlines.
3. **Reputation & Blind Review Engine**:
   - Two-way blind review state machine (`PENDING_PUBLICATION` -> mutual submission / deadline publication).
   - Dynamic 1–5 star contextual categories and weighted arithmetic mean calculation.
   - Pre-computed aggregate cache (`rating_aggregates`) and repair utility (`recalculateProfileRatings`).
4. **Lifecycle Event Hooks**:
   - Automated interaction generation on application review (`REVIEWED`), interview (`INTERVIEW_COMPLETED`), assessment evaluation (`EVALUATED`), internship completion (`INTERNSHIP_COMPLETED`), and course completion (`COURSE_COMPLETED`).
5. **Frontend 3-Pillar Trust UI**:
   - **Verification Trust Signals**: KYC Status, Identity, Domain, Accreditation.
   - **Objective Skill Verification**: Assessment score 0–100 from Skill Bridge evaluation.
   - **Experience Reputation**: 1.0–5.0 star weighted average across verified interaction categories.
   - **Pending Ratings Widget**: Interactive dashboard widget with deadline countdown timer.
   - **Admin Moderation Console**: Report/appeal queue, review hide/restore, suspicious activity flags, and aggregate repair.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Drizzle ORM Rating Schema | 10 new rating tables + 8 PostgreSQL enums in `db/schema.js` & `db/relations.js` | M1 | Survey / R1 |
| 2 | JSON DB Fallback Storage | Storage arrays, atomic mutations, and helper functions in `lib/db.js` | M1 | Survey / R1 |
| 3 | Mock Drizzle Query Builder | Support for 10 rating tables in `createMockDrizzleDb` (`db/index.js`) | M1 | Survey / R1 |
| 4 | Rating Migration Script | Migration SQL and schema snapshot via Drizzle Kit | M1 | Survey / R1 |
| 5 | Seed Rating Categories | Standard 1-5 categories for Application, Interview, Internship, Course contexts | M1 | Survey / R1 |
| 6 | Rating Eligibility Service | `getRatingEligibility()` validating session, interaction state, deadlines, duplicates | M2 | Survey / R2 |
| 7 | Server Rating Submission API | `POST /api/ratings` with transactional integrity, scoring, and Better Auth guard | M2 | Survey / R2 |
| 8 | Two-Way Blind Review Engine | State machine holding reviews until mutual submission or deadline expiry | M2 | Survey / R2 |
| 9 | Anti-Fraud & Security Rules | Self-rating block, compound uniqueness `(interactionId, reviewerUserId)`, velocity limiter | M2 | Survey / R2 |
| 10 | Strict Role Terminology | Strict usage of `STUDENT`, `INDUSTRY`, `INSTITUTE` across domain objects and API responses | M2 | Survey / R2 |
| 11 | Application Review Hook | Creation of `APPLICATION_REVIEW` interaction on application status -> `REVIEWED` | M3 | Survey / R3 |
| 12 | Interview Lifecycle Hook | Creation of `INTERVIEW` interaction on status -> `INTERVIEW_COMPLETED` | M3 | Survey / R3 |
| 13 | Task/Assessment Hook | Linking objective skill verification score (0-100) and evaluation interaction | M3 | Survey / R3 |
| 14 | Internship Blind Review Hook | Creation of 2-way blind interaction on internship status -> `INTERNSHIP_COMPLETED` | M3 | Survey / R3 |
| 15 | Course/Seminar Hook | Creation of Institute/Student interaction on course completion | M3 | Survey / R3 |
| 16 | 3-Pillar Reputation Breakdown Component | `ReputationBreakdown.jsx` separating Badges, Skill 0-100, and Experience 1-5 stars | M4 | Survey / R4 |
| 17 | Student Profile Integration | Reputation & Trust section on `app/student/profile/page.jsx` with empty state handling | M4 | Survey / R4 |
| 18 | Industry Profile Integration | Verified employer reputation card on industry/recruiter views and candidate cards | M4 | Survey / R4 |
| 19 | Institute Profile Integration | Academic reputation and employer satisfaction scorecard on institute pages | M4 | Survey / R4 |
| 20 | Interactive Rating Modal | Context-specific dynamic categories (1-5), pros/cons, recommendation, deadline alerts | M4 | Survey / R4 |
| 21 | Pending Ratings Dashboard Widget | Dashboard widget on `app/home/page.jsx` with countdown timer and eligibility CTA | M4 | Survey / R4 |
| 22 | Admin Reputation Management View | `app/admin/reputation/page.jsx` with filterable review table and action controls | M5 | Survey / R5 |
| 23 | Review Moderation API | Endpoints to hide, restore, and flag reviews (`/api/admin/ratings/**`) | M5 | Survey / R5 |
| 24 | Reports & Appeals Workflow | Endpoints and audit logs for user reports and review appeals | M5 | Survey / R5 |
| 25 | Anti-Fraud Activity Radar | Detection of suspicious rating spikes, duplicate IP clusters, unverified interactions | M5 | Survey / R5 |
| 26 | Aggregate Recalculation Engine | `recalculateProfileRatings(targetType, targetId)` utility for aggregate repair | M5 | Survey / R5 |
| 27 | E2E Testing Suite (Tiers 1-4) | Comprehensive test harness covering unit, boundary, pipeline, and real-world flows | M6 / E2E Track | Survey / Acceptance |
| 28 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing, gap analysis, and robustness hardening | M6 | Survey / Acceptance |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema & Migration Architecture | R1: `db/schema.js`, `db/relations.js`, `lib/db.js`, `db/index.js`, seed categories, migration | none | DONE |
| M2 | Rating Eligibility & Server-Side Security Engine | R2: `lib/rating-engine.js`, `app/api/ratings/**`, Better Auth session security, blind review state machine | M1 | DONE |
| M3 | Workflow & Entity Event Lifecycle Integration | R3: Event hooks in applications (`REVIEWED`), interviews, assessments, internships, courses | M1, M2 | DONE |
| M4 | Frontend UI Components, Profile Integration & Dashboard | R4: `components/reputation/**`, Student/Industry/Institute profile trust sections, Pending Ratings widget, Rating Modal | M1, M2, M3 | DONE |
| M5 | Admin Moderation, Anti-Fraud & Aggregate Recalculation | R5: `app/admin/reputation/page.jsx`, admin moderation APIs, reports/appeals workflow, recalculation utility | M1, M2, M3 | DONE |
| M6 | Final Milestone: 100% E2E Test Suite & Adversarial Hardening | E2E Test Suite verification (Tiers 1-4) + Tier 5 Adversarial Coverage Hardening | M1-M5, E2E Track | DONE |

---

## Interface Contracts

### 1. `getRatingEligibility` (`lib/rating-engine.js`)
```typescript
interface RatingEligibilityInput {
  reviewerUserId: string;
  targetEntityId: string;
  targetEntityType: 'STUDENT' | 'INDUSTRY' | 'INSTITUTE';
  interactionId?: string;
  contextType?: 'APPLICATION_REVIEW' | 'INTERVIEW_FEEDBACK' | 'TASK_EVALUATION' | 'INTERNSHIP_PERFORMANCE' | 'COURSE_EVALUATION' | 'SEMINAR_FEEDBACK';
}

interface RatingEligibilityResult {
  eligible: boolean;
  reason?: string;
  code?: 'UNAUTHORIZED' | 'SELF_RATING_FORBIDDEN' | 'UNVERIFIED_INTERACTION' | 'INTERACTION_STAGE_INVALID' | 'DEADLINE_EXPIRED' | 'ALREADY_RATED';
  interaction?: {
    id: string;
    interactionType: string;
    status: string;
    isBlind: boolean;
    deadline?: string;
    metadata?: Record<string, any>;
  };
  allowedCategories?: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    minScore: number;
    maxScore: number;
    weight: number;
  }>;
  isBlind?: boolean;
  deadline?: string;
  existingRatingId?: string;
}
```

### 2. Rating Creation API Contract (`POST /api/ratings`)
```typescript
interface CreateRatingInput {
  interactionId: string;
  contextType: string;
  targetUserId: string;
  targetEntityId: string;
  targetRole: 'STUDENT' | 'INDUSTRY' | 'INSTITUTE';
  scores: Record<string, number>; // Category code -> integer 1..5
  recommendation: 'RECOMMENDED' | 'NEUTRAL' | 'NOT_RECOMMENDED';
  headline?: string;
  reviewText?: string;
  pros?: string[];
  cons?: string[];
}

interface CreateRatingOutput {
  success: boolean;
  ratingId: string;
  status: 'PUBLISHED' | 'PENDING_PUBLICATION';
  overallScore: number;
  isBlind: boolean;
  publishedAt?: string;
  message: string;
}
```

### 3. Aggregate Recalculation Contract (`recalculateProfileRatings`)
```typescript
function recalculateProfileRatings(
  targetRole: 'STUDENT' | 'INDUSTRY' | 'INSTITUTE',
  targetEntityId: string
): Promise<{
  targetRole: string;
  targetEntityId: string;
  totalRatingsCount: number;
  verifiedRatingsCount: number;
  averageScore: number;
  recommendationRate: number;
  categoryBreakdown: Record<string, { average: number; count: number; name: string }>;
  scoreDistribution: { "1": number; "2": number; "3": number; "4": number; "5": number };
  contextBreakdown: Record<string, number>;
  objectiveSkillScore: number;
  verificationTrustLevel: 'UNVERIFIED' | 'VERIFIED_TIER1' | 'VERIFIED_TIER2' | 'GOLD_TRUSTED';
  lastRecalculatedAt: string;
}>;
```

---

## Code Layout & Write Ownership
| Module / Area | File Paths | Responsible Milestone / Worker |
|---|---|---|
| Database Schema & Drizzle Models | `db/schema.js`, `db/relations.js`, `drizzle.config.js`, `drizzle/**` | Milestone 1 (Worker M1) |
| Local Database & Mock ORM | `lib/db.js`, `db/index.js`, `data/db.json`, `data/seed.json` | Milestone 1 (Worker M1) |
| Rating & Eligibility Engine | `lib/rating-engine.js`, `lib/rating-categories.js` | Milestone 2 (Worker M2) |
| Rating & Interaction API Handlers | `app/api/ratings/route.js`, `app/api/ratings/[id]/route.js`, `app/api/ratings/eligibility/route.js`, `app/api/ratings/pending/route.js` | Milestone 2 (Worker M2) |
| Workflow Lifecycle Hooks | `app/api/applications/route.js`, `lib/scoring-engine.js`, `lib/assessment-engine.js` | Milestone 3 (Worker M3) |
| Frontend Reputation Components | `components/reputation/ReputationBreakdown.jsx`, `components/reputation/PendingRatingsWidget.jsx`, `components/reputation/RatingModal.jsx`, `components/reputation/ReviewCard.jsx`, `components/reputation/TrustSignalBadges.jsx`, `components/reputation/RatingHistogram.jsx` | Milestone 4 (Worker M4) |
| Profile & Dashboard Views | `app/student/profile/page.jsx`, `app/recruiter/candidates/page.jsx`, `app/institute/feedback/page.jsx`, `app/home/page.jsx` | Milestone 4 (Worker M4) |
| Admin Moderation Console & APIs | `app/admin/reputation/page.jsx`, `app/api/admin/ratings/route.js`, `app/api/admin/ratings/[id]/route.js`, `app/api/ratings/[id]/report/route.js`, `app/api/ratings/[id]/appeal/route.js` | Milestone 5 (Worker M5) |
| E2E Test Suite & Test Infra | `tests/test-rating-system.js`, `tests/rating-test-helper.js`, `TEST_INFRA.md`, `TEST_READY.md` | E2E Testing Track |
