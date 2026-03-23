/**
 * Seed script for CRESQL exercises.
 *
 * Reads exercises from scripts/data/cresql-exercises.json and inserts them
 * into the custom_theme_exercises table for the "cresql" custom theme.
 *
 * Usage:
 *   npx tsx scripts/seed-cresql-exercises.ts
 *
 * Requires DATABASE_URL to be set (or .env with it).
 */
import * as fs from "fs";
import * as path from "path";
import pg from "pg";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Minimal standalone validation (mirrors lib/themes/exercise-validator.ts)
// ---------------------------------------------------------------------------

const VALID_PHASES = new Set([
  "phase-0", "phase-1", "phase-2", "phase-3", "phase-4",
  "phase-5", "phase-6", "phase-7", "phase-8", "capstone",
]);

const VALID_MODES = new Set([
  "worked-example", "scaffolded", "open", "quiz", "debug",
]);

const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

interface Exercise {
  readonly id: string;
  readonly phase: string;
  readonly order: number;
  readonly [key: string]: unknown;
}

function validateExercise(obj: unknown, index: number): Exercise | null {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    console.error(`  [${index}] Not an object — skipping`);
    return null;
  }
  const o = obj as Record<string, unknown>;

  const requiredStrings = ["id", "title", "concept", "description", "expectedSql", "explanation"];
  for (const field of requiredStrings) {
    if (typeof o[field] !== "string" || (o[field] as string).length === 0) {
      console.error(`  [${index}] Missing or empty: ${field}`);
      return null;
    }
  }

  if (!VALID_PHASES.has(o.phase as string)) {
    console.error(`  [${index}] Invalid phase: ${String(o.phase)}`);
    return null;
  }
  if (!VALID_MODES.has(o.mode as string)) {
    console.error(`  [${index}] Invalid mode: ${String(o.mode)}`);
    return null;
  }
  if (!VALID_DIFFICULTIES.has(o.difficulty as string)) {
    console.error(`  [${index}] Invalid difficulty: ${String(o.difficulty)}`);
    return null;
  }
  if (typeof o.order !== "number" || !Number.isInteger(o.order) || o.order < 0) {
    console.error(`  [${index}] Invalid order`);
    return null;
  }
  if (!Array.isArray(o.hints)) {
    console.error(`  [${index}] hints is not an array`);
    return null;
  }
  if (!Array.isArray(o.tags)) {
    console.error(`  [${index}] tags is not an array`);
    return null;
  }

  return o as unknown as Exercise;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Load .env if present
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Set it in .env or as an environment variable.");
    process.exit(1);
  }

  // Read exercises JSON
  const jsonPath = path.resolve(__dirname, "data/cresql-exercises.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`Exercise file not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  if (!Array.isArray(raw)) {
    console.error("Expected an array of exercises");
    process.exit(1);
  }

  console.log(`Loaded ${raw.length} exercises from JSON`);

  // Validate
  const exercises: Exercise[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ex = validateExercise(raw[i], i);
    if (ex) exercises.push(ex);
  }

  console.log(`Validated: ${exercises.length} OK, ${raw.length - exercises.length} skipped`);

  if (exercises.length === 0) {
    console.error("No valid exercises to insert.");
    process.exit(1);
  }

  // Connect to DB
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Find cresql theme
    const themeResult = await pool.query(
      `SELECT id, slug FROM custom_themes WHERE slug = 'cresql'`
    );

    if (themeResult.rows.length === 0) {
      console.error("Custom theme with slug 'cresql' not found. Import the SQL dump first.");
      process.exit(1);
    }

    const themeId = themeResult.rows[0].id as number;
    console.log(`Found theme: id=${themeId}, slug=cresql`);

    // Upsert exercises in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let inserted = 0;
      for (const ex of exercises) {
        await client.query(
          `INSERT INTO custom_theme_exercises (custom_theme_id, exercise_id, exercise_json)
           VALUES ($1, $2, $3)
           ON CONFLICT (custom_theme_id, exercise_id)
           DO UPDATE SET exercise_json = EXCLUDED.exercise_json`,
          [themeId, ex.id, JSON.stringify(ex)]
        );
        inserted++;
      }

      await client.query("COMMIT");
      console.log(`\nSuccess! Upserted ${inserted} exercises for theme cresql (id=${themeId})`);

      // Summary by phase
      const phaseCounts: Record<string, number> = {};
      for (const ex of exercises) {
        phaseCounts[ex.phase] = (phaseCounts[ex.phase] || 0) + 1;
      }
      console.log("\nBy phase:");
      for (const [phase, count] of Object.entries(phaseCounts).sort()) {
        console.log(`  ${phase}: ${count} exercises`);
      }
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
