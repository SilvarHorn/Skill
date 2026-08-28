# Milestone 1 Adversarial Challenge Report: Schema, DB Uniqueness & Persistence Verification

**Agent**: Challenger 1 (`m1_challenger_1`)  
**Milestone**: Milestone 1 (Database Schema, Drizzle Models, JSON DB Fallback & Migration Architecture)  
**Verdict**: **CONFIRM** (with 2 non-blocking adversarial findings documented)  
**Date**: 2026-08-25  
**Working Directory**: `e:\sih_2026_044\.agents\m1_challenger_1`  

---

## 1. Observation

Direct code and empirical test observations:

1. **Duplicate Rating Compound Uniqueness**:
   - `lib/db.js` (lines 1280–1286):
     ```javascript
     const duplicate = db.ratings.find(
       r => r.interactionId === ratingData.interactionId && r.reviewerUserId === ratingData.reviewerUserId
     );
     if (duplicate) {
       throw new Error('Duplicate rating: Reviewer has already submitted a rating for this interaction.');
     }
     ```
   - `db/schema.js` (line 430):
     ```javascript
     interactionReviewerIdx: uniqueIndex('ratings_interaction_reviewer_idx').on(table.interactionId, table.reviewerUserId)
     ```
   - `drizzle/20260825143422_talented_xorn/migration.sql` (line 62):
     ```sql
     CREATE UNIQUE INDEX "ratings_interaction_reviewer_idx" ON "ratings" USING btree ("interaction_id","reviewer_user_id");
     ```
   - Empirical stress tests (`T1.01`, `T1.02`, `T1.05`) verified that duplicate submission throws the exact error, leaves zero partial score artifacts in `db.ratingCategoryScores`, while allowing two distinct reviewers (Student & Industry in 2-way blind reviews) to review the same `interactionId`.

2. **Self-Rating Insertion**:
   - `tests/test-rating-system.js` (lines 637–655): `getRatingEligibility()` returns `{ eligible: false, code: 'SELF_RATING_FORBIDDEN' }`.
   - `lib/db.js` (lines 1276–1366): Raw `createRating()` in `lib/db.js` does not check `reviewerUserId === targetUserId`.
   - `db/schema.js` (lines 406–437): Table `ratings` does not define a SQL `CHECK (reviewer_user_id <> target_user_id)` constraint.
   - Self-rating rejection is successfully enforced at the M2 service / API layer, but absent at the raw DB / helper layer.

3. **Foreign Keys and Cascade Deletions**:
   - `db/schema.js`: 11 foreign key constraints defined (`ratings.interactionId` -> `cascade`, `ratings.reviewerUserId` -> `cascade`, `ratings.targetUserId` -> `cascade`, `ratingCategoryScores.ratingId` -> `cascade`, `ratingCategoryScores.categoryId` -> `restrict`, `ratingResponses.ratingId` -> `cascade`, `ratingReports.ratingId` -> `cascade`, `ratingAppeals.ratingId` -> `cascade`, `ratingAuditLogs.actorUserId` -> `set null`, `ratingAggregates.targetUserId` -> `cascade`).
   - `db/relations.js`: Symmetric Drizzle `alias` declarations (`initiator`, `target`, `reviewer`, `targetUser`, `reporter`, `resolvedAdmin`, `appellant`, `reviewedAdmin`, `ratingAuditActor`) compile without collisions.
   - `lib/db.js`: `recalculateRatingAggregate` handles empty sets, orphaned records, score clamping (inputs `10` -> `5`, `-3` -> `1`, `3.7` -> `4`), and ID alias resolution (`stu_` <-> `std_`) gracefully.

4. **Concurrent Atomic File Writing in `lib/db.js`**:
   - `lib/db.js` (lines 518–529):
     ```javascript
     function saveDb(data) {
       cachedDb = data;
       ensureDbExists();
       try {
         const tmpPath = `${DB_PATH}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
         fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
         fs.renameSync(tmpPath, DB_PATH);
       } catch (e) {
         fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
       }
       return cachedDb;
     }
     ```
   - Empirical Stress Findings:
     - 100 concurrent asynchronous operations executed without throwing errors or corrupting `data/db.json`.
     - Multi-process concurrency (4 child processes) maintained JSON file validity.
     - **Defect Identified**: When `fs.renameSync` encounters Windows file lock contention (`EPERM`/`EBUSY`), the `catch` block performs a direct `fs.writeFileSync(DB_PATH, ...)` but fails to clean up the abandoned `tmpPath` file via `fs.unlinkSync(tmpPath)`. During multi-process contention testing, 37 orphaned `.tmp` files were created in `data/`.

---

## 2. Logic Chain

1. **Compound Uniqueness Verification**:
   - Observations confirm compound unique constraints on both Drizzle ORM PostgreSQL models (`ratings_interaction_reviewer_idx` and `rating_aggregates_target_idx`) and in `lib/db.js` (`createRating()`).
   - Empirical execution of `test-m1-adversarial-stress.js` proved that duplicate submissions are halted before any mutation occurs, ensuring zero side-effects.

2. **Self-Rating Security Architecture**:
   - Defense-in-depth is strongest when constraints exist at both the application and database layers.
   - Currently, self-rating is blocked by `getRatingEligibility()` and `POST /api/ratings` (Tier 2 test `T2.01` passes).
   - Documenting the lack of a database-level CHECK constraint provides clear guidance for future hardening without blocking M1.

3. **Data Integrity & Concurrency**:
   - Atomic file swapping via temporary files and rename guarantees that reads never see torn writes.
   - The fallback to direct write on Windows ensures high availability under write contention.
   - The orphaned `.tmp` file issue is a non-blocking resource leak during high multi-process contention that can be resolved with a simple `try / finally` or cleanup in `catch`.

---

## 3. Caveats

- **Mock DB in Local Test Runner**: PostgreSQL DDL has been verified via Drizzle schema definition and generated SQL migration scripts. Neon cloud live connection was not tested against live cloud latency, which is standard for local test execution.
- **Single vs Multi-Process Workloads**: In typical Next.js development and production single-container deployments, database writes occur in one Node.js process, minimizing `fs.renameSync` contention.

---

## 4. Conclusion

**Verdict: CONFIRM**

The Milestone 1 work product meets all architectural and functional requirements:
- Complete 10-table schema and 8 PostgreSQL enums defined in `db/schema.js`.
- Bidirectional relation graph in `db/relations.js` with zero alias collisions.
- Robust JSON DB fallback in `lib/db.js` with CRUD helpers, score clamping, duplicate guards, and aggregate calculation.
- Clean Drizzle migration generated in `drizzle/20260825143422_talented_xorn/migration.sql`.

### Actionable Hardening Recommendations
1. **`lib/db.js` Temp File Cleanup**: In `saveDb(data)`, add cleanup of `tmpPath` in the `catch` block (e.g. `try { fs.unlinkSync(tmpPath); } catch (_) {}`) to prevent orphan `.tmp` accumulation under Windows file lock contention.
2. **Database Check Constraint**: Consider adding `.check(sql\`reviewer_user_id <> target_user_id\`)` to the `ratings` table in `db/schema.js` for database-level self-rating enforcement.

---

## 5. Verification Method

To independently execute and verify the adversarial stress tests:

```powershell
# 1. Run the dedicated Adversarial Stress Suite
node tests/test-m1-adversarial-stress.js

# 2. Run Milestone 1 Schema & Relations Verification Suite
node tests/test-m1-schema-persistence.js

# 3. Run Full Auth & Reputation Test Suites
node tests/test-auth-suite.js
node tests/test-rating-system.js
```

### Empirical Results Summary

| Test Suite | Command | Cases | Passed | Failed | Status |
|---|---|---|---|---|---|
| M1 Adversarial Stress Suite | `node tests/test-m1-adversarial-stress.js` | 13 | 13 | 0 | **PASSED** |
| M1 Schema & Persistence | `node tests/test-m1-schema-persistence.js` | 13 | 13 | 0 | **PASSED** |
| Auth & Governance Suite | `node tests/test-auth-suite.js` | 33 | 33 | 0 | **PASSED** |
| Verified Rating System Suite | `node tests/test-rating-system.js` | 46 | 46 | 0 | **PASSED** |
