import { Elysia } from "elysia";
import { sql } from "drizzle-orm";
import { db } from "../db";

export const healthRoutes = new Elysia({ prefix: "/health" }).get("/", async () => {
  let dbStatus = "unknown";
  let dbError: string | null = null;

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = "disconnected";
    dbError = error?.message ?? String(error);
  }

  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      ...(dbError ? { error: dbError } : {}),
    },
  };
});
