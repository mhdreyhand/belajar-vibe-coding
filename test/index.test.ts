import { describe, expect, it, afterAll } from "bun:test";
import { app } from "../src/index";
import { db, pool } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Elysia App API", () => {
  const testEmail = "reyhan@email.com";

  afterAll(async () => {
    // Bersihkan test data setelah pengujian selesai
    try {
      await db.delete(users).where(eq(users.email, testEmail));
    } catch {}
    await pool.end();
  });

  it("GET / returns welcome message", async () => {
    const response = await app.handle(new Request("http://localhost:3000/"));
    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, any>;
    expect(data.message).toBe("Welcome to Elysia + Bun + Drizzle + MySQL API");
    expect(data.healthCheck).toBe("/health");
  });

  it("GET /health returns health status with connected database", async () => {
    const response = await app.handle(new Request("http://localhost:3000/health"));
    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, any>;
    expect(data.status).toBe("ok");
    expect(data.database?.status).toBe("connected");
  });

  it("POST /api/users registers a new user successfully", async () => {
    // Pastikan data belum ada sebelum test
    await db.delete(users).where(eq(users.email, testEmail));

    const response = await app.handle(
      new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Reyhan",
          email: testEmail,
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as Record<string, any>;
    expect(data).toEqual({ data: "OK" });

    // Verifikasi data tersimpan di database dan password berupa hash bcrypt
    const [savedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail));

    expect(savedUser).toBeDefined();
    expect(savedUser!.name).toBe("Reyhan");
    expect(savedUser!.password).not.toBe("rahasia");
    const isPasswordValid = await Bun.password.verify("rahasia", savedUser!.password);
    expect(isPasswordValid).toBe(true);
  });

  it("POST /api/users returns error when email is already registered", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Reyhan Duplikat",
          email: testEmail,
          password: "rahasialagi",
        }),
      })
    );

    expect(response.status).toBe(400);
    const data = (await response.json()) as Record<string, any>;
    expect(data).toEqual({ error: "Email sudah terdaftar" });
  });
});
