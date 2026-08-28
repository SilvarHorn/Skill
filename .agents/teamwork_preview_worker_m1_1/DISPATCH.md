## 2026-08-24T17:57:36Z
You are Worker M1 for the Skill Bridge platform.
Your working directory is: e:\sih_2026_044\.agents\teamwork_preview_worker_m1_1\
Project root: e:\sih_2026_044

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You own write access to:
- `db/schema.js`
- `lib/signup-intent.js`
- `lib/auth.js`
- `lib/onboarding-calc.js`
- `tests/auth-test-helper.js`

Authoritative files & blueprints:
- `e:\sih_2026_044\.agents\ORIGINAL_REQUEST.md`
- `e:\sih_2026_044\PROJECT.md`
- `e:\sih_2026_044\TEST_INFRA.md`
- `e:\sih_2026_044\.agents\teamwork_preview_explorer_m1_1\report.md`
- `e:\sih_2026_044\.agents\teamwork_preview_explorer_m1_1\handoff.md`

Your tasks for Milestone M1:
1. Update `db/schema.js`:
   - Remove line 8 (`const { email, github, linkedin } = require('better-auth');`) to fix ESM Webpack build failure.
   - Update `userRoleEnum` to include `['STUDENT', 'INDUSTRY', 'INSTITUTE', 'ORGANIZATION', 'ADMIN']`.
   - Add `profileCompleted: boolean('profile_completed').default(false).notNull()` to `users` table.
   - Define `instituteProfiles` table (`institute_profile`) with 1:1 foreign key constraint `userId` references `users.id` ({ onDelete: 'cascade' }), unique index on `userId`, fields: `id`, `userId`, `instituteName`, `instituteCode`, `instituteType`, `address` (jsonb), `website`, `logoUrl`, `contactPhone`, `officialEmail`, `departments` (jsonb), `placementContact` (jsonb), `verificationStatus` (enum `PENDING`, `APPROVED`, `REJECTED`, `INFO_REQUESTED`), `verificationDocs` (jsonb), `profileCompletion`, `currentOnboardingStep`, `createdAt`, `updatedAt`.
   - Add `instituteProfilesRelations` and export aliases:
     - `institute_profile: instituteProfiles`
     - `industryProfiles: organizationProfiles`
     - `industry_profile: organization_profile`
2. Update `lib/signup-intent.js`:
   - Set `ALLOWED_SIGNUP_ROLES = ['STUDENT', 'INDUSTRY', 'INSTITUTE', 'ORGANIZATION']`.
   - Maintain 403 `ADMIN_REGISTRATION_FORBIDDEN` and 256-bit cryptographic token generation.
3. Update `lib/auth.js`:
   - Include `profileCompleted: { type: "boolean", defaultValue: false, input: false }` in `user.additionalFields`.
   - In `databaseHooks.user.create.after`, handle `INSTITUTE` role by auto-provisioning 1:1 `instituteProfiles` record and logging `ACCOUNT_CREATED` and `ROLE_ASSIGNED` audit records.
4. Update `lib/onboarding-calc.js`:
   - Ensure `calculateStudentCompletion(profile)` (8 categories, 0-100%).
   - Ensure `calculateOrganizationCompletion(profile)` (7 categories, 0-100%).
   - Implement `calculateInstituteCompletion(profile)` (6 categories, 0-100%) and `getInstituteCompletionDetails(profile)`.
   - Implement and export universal `calculateProfileCompletion(userOrRole, profile)` and `isProfileComplete(userOrRole, profile, threshold = 70)`.
5. Update `tests/auth-test-helper.js` if necessary to support the new schemas/roles.
6. Verify and run test suites:
   - `node tests/test-auth-suite.js`
   - `node scripts/test-matching-rules.js`
   - `node tests/test-verification-system.js`
   - `npm run build`
7. Write your detailed handoff report in `e:\sih_2026_044\.agents\teamwork_preview_worker_m1_1\handoff.md` and send a completion message.
