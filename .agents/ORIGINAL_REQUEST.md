# Original User Request

## Initial Request — 2026-08-26T16:13:10Z

Audit, repair, and verify the complete database, schema, Drizzle ORM, Better Auth, and Neon database integration for the project.

Working directory: E:\sih_2026_044
Integrity mode: development

## Requirements

### R1. Schema & Relationship Audit & Repair
Inspect and repair all Drizzle ORM schema files (`user.js`, `student.js`, `industry.js`, `institute.js`, `questions.js`, `ratings.js`), aggregators (`db/schema/index.js`), table relations, foreign key constraints, primary keys (UUID / Better Auth compatible types), unique constraints, and indexes. Ensure no circular dependencies or duplicate table definitions exist.

### R2. Database Driver & Environment Configuration
Ensure `db/index.js`, `drizzle.config.js`, `.env` handling, and package dependencies are fully compatible with `@neondatabase/serverless` / PostgreSQL driver, Node.js module system (CommonJS / ESM), and Better Auth integration without hardcoding secrets or credentials.

### R3. Migration & Verification Execution
Generate migrations or run schema push safely, verify database tables in Neon, run database connection checks, test CRUD operations across User, Student, Industry, Institute, Questions, and Ratings entities, and verify Better Auth & Google OAuth database persistence.

## Acceptance Criteria

### Schema Integrity
- All schema files (`user.js`, `student.js`, `industry.js`, `institute.js`, `questions.js`, `ratings.js`) export valid Drizzle tables without circular imports.
- Schema aggregator exports all tables and relations cleanly.
- ID types across tables (e.g. `user.id`, `student.userId`, `industry.userId`, `institute.userId`) are strictly compatible.
- Foreign key constraints enforce appropriate cascade/restrict deletion rules.

### Database Connection & Config
- `drizzle.config.js` points to the correct schema path and dialect.
- `db/index.js` connects cleanly to Neon using `DATABASE_URL` from `.env`.
- Package dependencies and module format (CommonJS / ESM) are consistent.

### Migration & Database State
- `npx drizzle-kit generate` or `push` executes cleanly with zero errors.
- Database contains expected tables (`users`, `sessions`, `accounts`, `verifications`, `students`, `industries`, `institutes`, `questions`, `ratings`).

### Functional Verification
- Database connection script verifies active connection to Neon.
- CRUD operations for User, Student, Industry, Institute, Questions, and Ratings pass.
- Better Auth schema requirements (User, Session, Account, Verification) match expected structure.
