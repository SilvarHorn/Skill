/**
 * Skill Bridge Platform
 * Unified Profile Setup API
 *
 * File:
 * app/api/profile/setup/route.js
 *
 * Methods:
 * GET  - Load the authenticated user's real profile
 * POST - Save/update profile
 * PUT  - Save/update profile
 *
 * Database:
 * Neon PostgreSQL + Drizzle ORM
 *
 * Tables:
 * students
 * industries
 * institutes
 */

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import {
  getStudentCompletionDetails,
  getOrgCompletionDetails,
  getInstituteCompletionDetails,
} from "@/lib/onboarding-calc";

/* -------------------------------------------------------------------------- */
/*                              CONFIGURATION                                 */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";

/*
 * Only these roles can have a profile through this endpoint.
 */
const PROFILE_ROLES = {
  STUDENT: "students",
  INDUSTRY: "industries",
  INSTITUTE: "institutes",
};

/*
 * Fields that the client is NEVER allowed to modify.
 *
 * These are controlled by Better Auth / the server.
 */
const PROTECTED_FIELDS = new Set([
  "id",
  "userId",
  "user_id",
  "role",
  "accountStatus",
  "account_status",
  "verificationStatus",
  "verification_status",
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
]);

/* -------------------------------------------------------------------------- */
/*                              ROLE HELPERS                                  */
/* -------------------------------------------------------------------------- */

function normalizeRole(role) {
  const value = String(role || "STUDENT")
    .trim()
    .toUpperCase();

  if (value === "INDUSTRY") {
    return "INDUSTRY";
  }

  if (value === "ORGANIZATION") {
    return "INDUSTRY";
  }

  if (value === "INSTITUTE") {
    return "INSTITUTE";
  }

  return "STUDENT";
}

/* -------------------------------------------------------------------------- */
/*                         CAMEL CASE CONVERSION                              */
/* -------------------------------------------------------------------------- */

/*
 * Converts JavaScript field names to PostgreSQL column names.
 *
 * Examples:
 *
 * fullName              -> full_name
 * userId                -> user_id
 * profileCompletion     -> profile_completion
 * currentOnboardingStep -> current_onboarding_step
 * careerPreferences     -> career_preferences
 * instituteName         -> institute_name
 * taxIdGstin            -> tax_id_gstin
 *
 * Special URL handling is included because:
 *
 * githubURL -> github_url
 * linkedinURL -> linkedin_url
 */

function camelToSnake(key) {
  const specialCases = {
    githubURL: "github_url",
    linkedinURL: "linkedin_url",
    websiteURL: "website_url",
    logoURL: "logo_url",
    taxIdGstin: "tax_id_gstin",
  };

  if (specialCases[key]) {
    return specialCases[key];
  }

  return String(key)
    .replace(/URL$/g, "_url")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*                         SNAKE -> CAMEL CONVERSION                          */
/* -------------------------------------------------------------------------- */

function snakeToCamel(key) {
  return String(key).replace(
    /_([a-z])/g,
    (_, letter) => letter.toUpperCase()
  );
}

function rowToCamelCase(row) {
  if (!row) {
    return null;
  }

  const output = {};

  for (const [key, value] of Object.entries(row)) {
    output[snakeToCamel(key)] = value;
  }

  return output;
}

/* -------------------------------------------------------------------------- */
/*                         JSON FIELD NORMALIZATION                           */
/* -------------------------------------------------------------------------- */

function normalizeJsonValue(value) {
  /*
   * PostgreSQL json/jsonb fields should receive JSON strings
   * when using the raw SQL path below.
   */
  if (
    value !== null &&
    typeof value === "object"
  ) {
    return JSON.stringify(value);
  }

  return value;
}

/* -------------------------------------------------------------------------- */
/*                       GET DATABASE COLUMNS                                 */
/* -------------------------------------------------------------------------- */

/*
 * We inspect the actual PostgreSQL table before saving.
 *
 * This is intentional because your students, industries and institutes
 * schemas can evolve independently.
 *
 * Only columns that really exist in the selected table will be written.
 */

async function getTableColumns(tableName) {
  const result = await db.execute(
    sql`
      SELECT
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `
  );

  return result.rows || [];
}

/* -------------------------------------------------------------------------- */
/*                        GET CURRENT PROFILE                                 */
/* -------------------------------------------------------------------------- */

async function getProfile(tableName, userId) {
  /*
   * Table names are selected ONLY from PROFILE_ROLES above.
   *
   * Therefore this identifier is never supplied directly by the client.
   */
  const tableIdentifier = sql.raw(`"${tableName}"`);

  const result = await db.execute(
    sql`
      SELECT *
      FROM ${tableIdentifier}
      WHERE "user_id" = ${userId}
      LIMIT 1
    `
  );

  return result.rows?.[0] || null;
}

/* -------------------------------------------------------------------------- */
/*                         INSERT PROFILE                                     */
/* -------------------------------------------------------------------------- */

async function insertProfile(
  tableName,
  userId,
  profileData,
  role,
  user
) {
  const columns = await getTableColumns(tableName);

  if (!columns.length) {
    throw new Error(
      `Database table "${tableName}" does not exist or has no columns.`
    );
  }

  const availableColumns = new Map(
    columns.map((column) => [
      column.column_name,
      column,
    ])
  );

  /*
   * Always associate the row with the authenticated user.
   */
  const values = {
    user_id: userId,
  };

  /*
   * Add useful initial user information only when those
   * columns actually exist.
   */
  if (
    availableColumns.has("email") &&
    user.email
  ) {
    values.email = user.email;
  }

  if (
    availableColumns.has("full_name") &&
    user.name
  ) {
    values.full_name = user.name;
  }

  if (
    availableColumns.has("company_name") &&
    user.name
  ) {
    values.company_name = user.name;
  }

  if (
    availableColumns.has("institute_name") &&
    user.name
  ) {
    values.institute_name = user.name;
  }

  /*
   * Copy only fields that actually exist in PostgreSQL.
   */
  for (const [key, value] of Object.entries(
    profileData || {}
  )) {
    if (PROTECTED_FIELDS.has(key)) {
      continue;
    }

    const columnName = camelToSnake(key);

    if (!availableColumns.has(columnName)) {
      continue;
    }

    /*
     * Don't overwrite server-owned fields.
     */
    if (
      columnName === "user_id" ||
      columnName === "id" ||
      columnName === "role" ||
      columnName === "verification_status" ||
      columnName === "account_status"
    ) {
      continue;
    }

    values[columnName] =
      normalizeJsonValue(value);
  }

  /*
   * Set initial verification state for organizations/institutes
   * only if the actual table contains that column.
   */
  if (
    availableColumns.has("verification_status") &&
    role !== "STUDENT" &&
    values.verification_status === undefined
  ) {
    values.verification_status = "PENDING";
  }

  const columnNames = Object.keys(values);

  const tableIdentifier = sql.raw(
    `"${tableName}"`
  );

  const columnsSql = sql.raw(
    columnNames
      .map((column) => `"${column}"`)
      .join(", ")
  );

  /*
   * Build parameterized values.
   */
  const valueParts = columnNames.map(
    (column) => {
      const columnInfo =
        availableColumns.get(column);

      const value = values[column];

      /*
       * JSON/JSONB fields.
       */
      if (
        columnInfo?.data_type === "json" ||
        columnInfo?.data_type === "jsonb"
      ) {
        return sql`${value}::jsonb`;
      }

      return sql`${value}`;
    }
  );

  const valuesSql = sql.join(
    valueParts,
    sql`, `
  );

  const result = await db.execute(
    sql`
      INSERT INTO ${tableIdentifier}
      (${columnsSql})
      VALUES (${valuesSql})
      RETURNING *
    `
  );

  return result.rows?.[0] || null;
}

/* -------------------------------------------------------------------------- */
/*                         UPDATE PROFILE                                     */
/* -------------------------------------------------------------------------- */

async function updateProfile(
  tableName,
  userId,
  profileData
) {
  const columns = await getTableColumns(tableName);

  if (!columns.length) {
    throw new Error(
      `Database table "${tableName}" does not exist.`
    );
  }

  const availableColumns = new Map(
    columns.map((column) => [
      column.column_name,
      column,
    ])
  );

  const updates = [];

  for (const [key, value] of Object.entries(
    profileData || {}
  )) {
    if (PROTECTED_FIELDS.has(key)) {
      continue;
    }

    const columnName = camelToSnake(key);

    /*
     * Never allow a client to change the owner.
     */
    if (
      columnName === "user_id" ||
      columnName === "id"
    ) {
      continue;
    }

    /*
     * Never allow profile setup to change the
     * verification status.
     */
    if (
      columnName === "verification_status"
    ) {
      continue;
    }

    const columnInfo =
      availableColumns.get(columnName);

    if (!columnInfo) {
      continue;
    }

    const normalizedValue =
      normalizeJsonValue(value);

    if (
      columnInfo.data_type === "json" ||
      columnInfo.data_type === "jsonb"
    ) {
      updates.push(
        sql`${sql.raw(
          `"${columnName}"`
        )} = ${normalizedValue}::jsonb`
      );
    } else {
      updates.push(
        sql`${sql.raw(
          `"${columnName}"`
        )} = ${normalizedValue}`
      );
    }
  }

  /*
   * Always update updated_at when it exists.
   */
  if (availableColumns.has("updated_at")) {
    updates.push(
      sql`"updated_at" = NOW()`
    );
  }

  if (!updates.length) {
    return getProfile(tableName, userId);
  }

  const tableIdentifier = sql.raw(
    `"${tableName}"`
  );

  const result = await db.execute(
    sql`
      UPDATE ${tableIdentifier}
      SET ${sql.join(updates, sql`, `)}
      WHERE "user_id" = ${userId}
      RETURNING *
    `
  );

  return result.rows?.[0] || null;
}

/* -------------------------------------------------------------------------- */
/*                         GET PROFILE COMPLETION                             */
/* -------------------------------------------------------------------------- */

function getCompletionDetails(
  role,
  profile
) {
  if (!profile) {
    return {
      completion: 0,
      breakdown: {},
      missingFields: [],
    };
  }

  try {
    if (role === "STUDENT") {
      return getStudentCompletionDetails(
        profile
      );
    }

    if (role === "INDUSTRY") {
      return getOrgCompletionDetails(
        profile
      );
    }

    if (role === "INSTITUTE") {
      return getInstituteCompletionDetails(
        profile
      );
    }
  } catch (error) {
    console.warn(
      "[Profile Setup] Completion calculation failed:",
      error?.message
    );
  }

  return {
    completion: Number(
      profile.profileCompletion ||
        profile.profile_completion ||
        0
    ),
    breakdown: {},
    missingFields: [],
  };
}

/* -------------------------------------------------------------------------- */
/*                         GET /api/profile/setup                             */
/* -------------------------------------------------------------------------- */

export async function GET(request) {
  try {
    /*
     * IMPORTANT:
     *
     * Do not trust x-user-id or x-user-role headers.
     *
     * The authenticated Better Auth session is the source of truth.
     */
    const session =
      await auth.api.getSession({
        headers: request.headers,
      });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized: Please sign in.",
        },
        {
          status: 401,
        }
      );
    }

    const user = session.user;

    const role = normalizeRole(user.role);

    const tableName =
      PROFILE_ROLES[role];

    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This account type does not have a profile setup.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find the real profile in Neon.
     */
    const databaseProfile =
      await getProfile(
        tableName,
        user.id
      );

    /*
     * Convert database snake_case fields into
     * the camelCase shape expected by the frontend.
     */
    const profile =
      rowToCamelCase(databaseProfile);

    const completionDetails =
      getCompletionDetails(
        role,
        profile
      );

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        image: user.image || null,
        role,
        accountStatus:
          user.accountStatus ||
          "ACTIVE",
        onboardingStatus:
          user.onboardingStatus ||
          (completionDetails.completion >= 70
            ? "COMPLETED"
            : "IN_PROGRESS"),
        profileCompleted:
          user.profileCompleted === true,
      },

      role,

      profileExists:
        Boolean(profile),

      profile,

      profileCompletion:
        completionDetails.completion,

      breakdown:
        completionDetails.breakdown,

      missingFields:
        completionDetails.missingFields,

      currentStep:
        profile?.currentOnboardingStep ||
        1,
    });
  } catch (error) {
    console.error(
      "[GET /api/profile/setup] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to retrieve profile setup state.",
        message:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                    POST /api/profile/setup                                 */
/* -------------------------------------------------------------------------- */

export async function POST(request) {
  return saveProfile(request);
}

/* -------------------------------------------------------------------------- */
/*                     PUT /api/profile/setup                                 */
/* -------------------------------------------------------------------------- */

export async function PUT(request) {
  return saveProfile(request);
}

/* -------------------------------------------------------------------------- */
/*                         SAVE PROFILE                                      */
/* -------------------------------------------------------------------------- */

async function saveProfile(request) {
  try {
    /* -------------------------------------------------------------------- */
    /*                         AUTHENTICATION                               */
    /* -------------------------------------------------------------------- */

    const session =
      await auth.api.getSession({
        headers: request.headers,
      });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized: Please sign in.",
        },
        {
          status: 401,
        }
      );
    }

    const user = session.user;

    /* -------------------------------------------------------------------- */
    /*                              ROLE                                    */
    /* -------------------------------------------------------------------- */

    /*
     * IMPORTANT:
     *
     * Ignore the role sent by the browser.
     * The Better Auth session determines the role.
     */
    const role = normalizeRole(
      user.role
    );

    const tableName =
      PROFILE_ROLES[role];

    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported profile role.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------------------- */
    /*                           REQUEST BODY                               */
    /* -------------------------------------------------------------------- */

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid profile data.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      step,
      stepData,
      profileData,
      action,
    } = body;

    /*
     * Support both payload formats:
     *
     * {
     *   stepData: {...}
     * }
     *
     * and:
     *
     * {
     *   profileData: {...}
     * }
     */
    const incomingProfile = {
      ...(stepData &&
      typeof stepData === "object"
        ? stepData
        : {}),

      ...(profileData &&
      typeof profileData === "object"
        ? profileData
        : {}),
    };

    /* -------------------------------------------------------------------- */
    /*                   REMOVE SERVER CONTROLLED FIELDS                   */
    /* -------------------------------------------------------------------- */

    for (const field of PROTECTED_FIELDS) {
      delete incomingProfile[field];
    }

    /*
     * Never accept role from the browser.
     */
    delete incomingProfile.role;

    /* -------------------------------------------------------------------- */
    /*                         CURRENT PROFILE                              */
    /* -------------------------------------------------------------------- */

    const currentDatabaseProfile =
      await getProfile(
        tableName,
        user.id
      );

    let currentProfile =
      rowToCamelCase(
        currentDatabaseProfile
      ) || {};

    /*
     * Merge existing profile with new data.
     */
    currentProfile = {
      ...currentProfile,
      ...incomingProfile,
    };

    /* -------------------------------------------------------------------- */
    /*                          STEP                                        */
    /* -------------------------------------------------------------------- */

    if (
      typeof step === "number" &&
      Number.isFinite(step)
    ) {
      const currentStep = Number(
        currentProfile.currentOnboardingStep ||
          1
      );

      currentProfile.currentOnboardingStep =
        Math.max(
          currentStep,
          Math.max(1, step)
        );
    }

    /* -------------------------------------------------------------------- */
    /*                       STUDENT VALIDATION                             */
    /* -------------------------------------------------------------------- */

    if (role === "STUDENT") {
      if (
        currentProfile.cgpa !== undefined &&
        currentProfile.cgpa !== null &&
        currentProfile.cgpa !== ""
      ) {
        const cgpa = Number(
          currentProfile.cgpa
        );

        if (
          !Number.isFinite(cgpa) ||
          cgpa < 0 ||
          cgpa > 10
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Invalid CGPA. CGPA must be between 0 and 10.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * Keep the student's email synchronized
       * with Better Auth.
       */
      if (!currentProfile.email) {
        currentProfile.email =
          user.email || "";
      }

      if (!currentProfile.fullName) {
        currentProfile.fullName =
          user.name || "";
      }
    }

    /* -------------------------------------------------------------------- */
    /*                       COMPLETION                                     */
    /* -------------------------------------------------------------------- */

    const completionDetails =
      getCompletionDetails(
        role,
        currentProfile
      );

    currentProfile.profileCompletion =
      completionDetails.completion;

    /* -------------------------------------------------------------------- */
    /*                       SUBMISSION                                     */
    /* -------------------------------------------------------------------- */

    const isCompleteAction =
      action ===
        "COMPLETE_ONBOARDING" ||
      action === "SUBMIT";

    if (isCompleteAction) {
      /*
       * Keep the same 70% completion threshold
       * used by your previous implementation.
       */
      if (
        completionDetails.completion < 70 &&
        completionDetails.missingFields.length > 3
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Incomplete profile. Please complete the required fields before submitting.",
            missingFields:
              completionDetails.missingFields,
            profileCompletion:
              completionDetails.completion,
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -------------------------------------------------------------------- */
    /*                       DATABASE SAVE                                  */
    /* -------------------------------------------------------------------- */

    let savedDatabaseProfile;

    if (currentDatabaseProfile) {
      /*
       * Existing row -> UPDATE.
       */
      savedDatabaseProfile =
        await updateProfile(
          tableName,
          user.id,
          {
            ...incomingProfile,

            ...(typeof step === "number"
              ? {
                  currentOnboardingStep:
                    currentProfile.currentOnboardingStep,
                }
              : {}),

            profileCompletion:
              completionDetails.completion,
          }
        );
    } else {
      /*
       * No row -> INSERT.
       */
      savedDatabaseProfile =
        await insertProfile(
          tableName,
          user.id,
          {
            ...incomingProfile,

            currentOnboardingStep:
              currentProfile.currentOnboardingStep ||
              1,

            profileCompletion:
              completionDetails.completion,
          },
          role,
          user
        );
    }

    const savedProfile =
      rowToCamelCase(
        savedDatabaseProfile
      );

    /* -------------------------------------------------------------------- */
    /*                         RESPONSE                                     */
    /* -------------------------------------------------------------------- */

    const finalStatus =
      isCompleteAction
        ? "COMPLETED"
        : completionDetails.completion > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED";

    return NextResponse.json({
      success: true,

      message: isCompleteAction
        ? `${role} profile completed successfully.`
        : "Profile draft saved successfully.",

      role,

      profileCompleted:
        isCompleteAction ||
        completionDetails.completion >= 70,

      onboardingStatus:
        finalStatus,

      verificationStatus:
        role === "STUDENT"
          ? undefined
          : "PENDING",

      profileCompletion:
        completionDetails.completion,

      breakdown:
        completionDetails.breakdown,

      missingFields:
        completionDetails.missingFields,

      profile:
        savedProfile,

      currentStep:
        savedProfile?.currentOnboardingStep ||
        currentProfile.currentOnboardingStep ||
        1,

      redirectUrl:
        role === "STUDENT"
          ? "/student/dashboard"
          : role === "INDUSTRY"
            ? "/industry/dashboard"
            : "/institute/dashboard",
    });
  } catch (error) {
    console.error(
      "[POST/PUT /api/profile/setup] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to save profile.",
        message:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}