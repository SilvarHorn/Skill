import dotenv from "dotenv";
dotenv.config();
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log("Connecting to live Neon database...");
  const client = await pool.connect();
  try {
    console.log("Creating/updating tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "emailVerified" boolean DEFAULT false NOT NULL,
        "image" text,
        "role" text DEFAULT 'STUDENT',
        "account_status" text DEFAULT 'ACTIVE',
        "onboarding_status" text DEFAULT 'NOT_STARTED',
        "profile_completed" boolean DEFAULT false,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY,
        "expiresAt" timestamp with time zone NOT NULL,
        "token" text NOT NULL UNIQUE,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
        "ipAddress" text,
        "userAgent" text,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "account" (
        "id" text PRIMARY KEY,
        "issuer" text NOT NULL,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamp with time zone,
        "refreshTokenExpiresAt" timestamp with time zone,
        "scope" text,
        "password" text,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
      );

      ALTER TABLE "account"
      ADD COLUMN IF NOT EXISTS "issuer" text;

      UPDATE "account"
      SET "issuer" = CASE
        WHEN "issuer" IS NOT NULL AND btrim("issuer") <> '' THEN "issuer"
        WHEN "providerId" = 'google' THEN 'https://accounts.google.com'
        WHEN "providerId" = 'credential' THEN 'local:credential'
        ELSE 'local:oauth:' || encode("providerId"::bytea, 'escape')
      END
      WHERE "issuer" IS NULL OR btrim("issuer") = '';

      ALTER TABLE "account"
      ALTER COLUMN "issuer" SET NOT NULL;

      DELETE FROM "user" u
      USING "user" dupe
      WHERE u.email = dupe.email
        AND u.id > dupe.id;

      DROP INDEX IF EXISTS "user_email_idx";
      ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_email_key";
      CREATE UNIQUE INDEX "user_email_idx" ON "user" ("email");
      CREATE UNIQUE INDEX IF NOT EXISTS "session_token_idx" ON "session" ("token");
      DROP INDEX IF EXISTS "account_provider_account_idx";
      CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_account_idx" ON "account" ("issuer", "accountId");
      CREATE INDEX IF NOT EXISTS "account_provider_idx" ON "account" ("providerId");

      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text PRIMARY KEY,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expiresAt" timestamp with time zone NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "students" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "full_name" text,
        "email" text,
        "headline" text,
        "bio" text,
        "skills" jsonb DEFAULT '[]'::jsonb,
        "projects" jsonb DEFAULT '[]'::jsonb,
        "certifications" jsonb DEFAULT '[]'::jsonb,
        "experience" jsonb DEFAULT '[]'::jsonb,
        "career_preferences" jsonb DEFAULT '{}'::jsonb,
        "profile_completion" integer DEFAULT 0,
        "current_onboarding_step" integer DEFAULT 1,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "industries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "company_name" text NOT NULL,
        "email" text,
        "industry_type" text,
        "company_size" text,
        "website" text,
        "description" text,
        "address" jsonb DEFAULT '{}'::jsonb,
        "documents" jsonb DEFAULT '[]'::jsonb,
        "verification_docs" jsonb DEFAULT '[]'::jsonb,
        "hiring_preferences" jsonb DEFAULT '{}'::jsonb,
        "verification_status" text DEFAULT 'PENDING',
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "institutes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "institute_name" text NOT NULL,
        "email" text,
        "institute_type" text,
        "aishe_code" text,
        "website" text,
        "address" jsonb DEFAULT '{}'::jsonb,
        "departments" jsonb DEFAULT '[]'::jsonb,
        "placement_contact" jsonb DEFAULT '{}'::jsonb,
        "verification_docs" jsonb DEFAULT '[]'::jsonb,
        "verification_status" text DEFAULT 'PENDING',
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );

      DROP TABLE IF EXISTS "ratings" CASCADE;
      DROP TABLE IF EXISTS "questions" CASCADE;

      CREATE TABLE "questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "industry_id" uuid REFERENCES "industries"("id") ON DELETE CASCADE,
        "student_id" uuid REFERENCES "students"("id") ON DELETE SET NULL,
        "title" text NOT NULL,
        "description" text,
        "category" text,
        "difficulty" text DEFAULT 'MEDIUM',
        "status" text DEFAULT 'OPEN',
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );

      CREATE TABLE "ratings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "question_id" uuid REFERENCES "questions"("id") ON DELETE CASCADE,
        "user_id" text REFERENCES "user"("id") ON DELETE CASCADE,
        "student_id" uuid REFERENCES "students"("id") ON DELETE CASCADE,
        "industry_id" uuid REFERENCES "industries"("id") ON DELETE CASCADE,
        "overall_score" numeric(3,2),
        "scores" jsonb DEFAULT '{}'::jsonb,
        "recommendation" text,
        "review" text,
        "status" text DEFAULT 'PUBLISHED',
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );
    `);
    console.log("Migration executed successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
