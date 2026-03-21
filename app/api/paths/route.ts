import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import {
  getAllPaths,
  computePathProgress,
  enrollUserInPath,
} from "@/lib/paths/loader";

/** GET /api/paths — list all paths with user progress */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getAdminPool();

  const [paths, progressResult] = await Promise.all([
    getAllPaths(),
    pool.query(
      `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
      [user.id]
    ),
  ]);

  const completedIds = new Set(
    progressResult.rows.map((r) => r.exercise_id as string)
  );

  const pathsWithProgress = await Promise.all(
    paths.map((path) => computePathProgress(user.id, path, completedIds))
  );

  return NextResponse.json({ paths: pathsWithProgress });
}

/** POST /api/paths — enroll in a learning path */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { pathId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { pathId } = body;
  if (typeof pathId !== "number") {
    return NextResponse.json(
      { error: "pathId (number) required" },
      { status: 400 }
    );
  }

  const enrollment = await enrollUserInPath(user.id, pathId);
  return NextResponse.json({ ok: true, enrollment });
}
