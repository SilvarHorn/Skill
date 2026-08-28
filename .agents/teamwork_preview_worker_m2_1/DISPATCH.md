## 2026-08-24T18:28:33Z
You are Worker M2 for the Skill Bridge platform.
Your working directory is: e:\sih_2026_044\.agents\teamwork_preview_worker_m2_1\
Project root: e:\sih_2026_044

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You own write access to:
- `components/auth/RoleSelector.jsx`
- `app/(auth)/login/page.jsx`
- `app/(auth)/register/page.jsx`
- `app/profile/complete/page.jsx`
- `app/institute/onboarding/page.jsx`
- `app/api/institute/onboarding/route.js`
- `components/shared/ProfileCompletionCard.jsx`
- `components/shared/ProfileGateModal.jsx`
- `app/industry/onboarding/page.jsx` (or redirect to organization onboarding)

Authoritative specifications & references:
- `e:\sih_2026_044\.agents\ORIGINAL_REQUEST.md` (Specifically §2, §3, §4)
- `e:\sih_2026_044\PROJECT.md`
- `e:\sih_2026_044\.agents\teamwork_preview_explorer_m0_1\report.md`
- `e:\sih_2026_044\.agents\teamwork_preview_explorer_m0_2\report.md`
- `lib/onboarding-calc.js`
- `lib/auth-client.js`
- `lib/signup-intent.js`

Your tasks for Milestone M2:
1. `components/auth/RoleSelector.jsx`:
   - Create reusable 3-role selector card component for `STUDENT`, `INDUSTRY`, and `INSTITUTE`.
   - Include distinct icon, title, description, badge, and selected state styling (dark theme palette matching `bg-slate-900/80`, `border-slate-800`, `text-emerald-400` / `border-emerald-500` on active).
   - Props: `selectedRole`, `onSelectRole`, `disabled`.
2. `app/(auth)/register/page.jsx` & `app/(auth)/login/page.jsx`:
   - Integrate `RoleSelector`.
   - On role selection + Google Sign In click, execute pre-OAuth handshake: call `POST /api/auth/signup-intent` with `{ role: selectedRole }`, then trigger `authClient.signIn.social({ provider: 'google', callbackURL: '/profile/complete' })`.
   - Include clear visual feedback, error handling, and role immutability warning banner ("Single Google account = Exactly One Role").
3. `app/profile/complete/page.jsx`:
   - Build generic onboarding dispatcher: checks user session / profile completion status.
   - If profile is incomplete (`profileCompleted === false` or `onboardingStatus !== 'COMPLETED'`), redirects to role-specific onboarding page:
     - `STUDENT` -> `/student/onboarding`
     - `INDUSTRY` or `ORGANIZATION` -> `/organization/onboarding`
     - `INSTITUTE` -> `/institute/onboarding`
     - `ADMIN` -> `/admin/dashboard`
   - If profile is complete, redirects to `/home` (or role dashboard `/student/dashboard`, `/organization/dashboard`, `/institute/dashboard`).
4. `app/institute/onboarding/page.jsx` & `app/api/institute/onboarding/route.js`:
   - Create multi-step academic onboarding wizard with dynamic SVG progress gauge (using `lib/onboarding-calc.js` math):
     - Step 1: Institute Basics (Institute Name, Type, AISHE Code / Reg Code, Website, Official Email, Phone, Logo URL)
     - Step 2: Campus & Location (Full Address, City, State, Pin Code)
     - Step 3: Academic Departments & Programs (Engineering, CS, Management, etc.)
     - Step 4: Placement / TPO Contact Details (TPO Name, Designation, Official Email, Phone)
     - Step 5: Accreditation & Verification Documents (NAAC/NBA/UGC info, document links/uploads)
     - Step 6: Review & Statutory Declaration (Legal declaration checkbox and final submit)
   - Draft persistence (`SAVE_DRAFT`) and final submit (`COMPLETE_ONBOARDING`) via `app/api/institute/onboarding/route.js` updating `institute_profile` and `user.onboardingStatus = 'COMPLETED'`.
5. `components/shared/ProfileCompletionCard.jsx`:
   - Interactive profile completion card displaying:
     - 70% threshold progress bar with color-coded stages (red < 40%, amber 40-69%, emerald >= 70%).
     - Required vs Optional items checklist with completion checkboxes and jump links.
     - Warning banner if < 70% ("Profile Incomplete - Minimum 70% required to browse opportunities and submit applications").
6. `components/shared/ProfileGateModal.jsx`:
   - Interception modal displayed when a student with < 70% profile attempts to apply for an opportunity.
   - Explains the 70% gate rule with current score vs required threshold and a direct CTA button "Complete Profile Now" -> `/student/onboarding`.
7. `app/industry/onboarding/page.jsx`:
   - Route alias or redirect page to `/organization/onboarding`.

Verification:
- Run `node tests/test-auth-suite.js`
- Run `node scripts/test-matching-rules.js`
- Run `node tests/test-verification-system.js`
- Run `npm run build`
- Ensure all tests pass and Next.js production build succeeds with 0 errors across all routes.
- Write handoff report to `e:\sih_2026_044\.agents\teamwork_preview_worker_m2_1\handoff.md` and send a completion message.
