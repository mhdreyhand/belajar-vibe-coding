import { describe, expect, it, afterAll } from "bun:test";
import { app } from "../src/index";
import { db, pool } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Elysia App API", () => {
  const testEmail = "reyhan@email.com";
  let validToken = "";

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

  it("POST /api/users/login logs in successfully with valid credentials", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as Record<string, any>;
    expect(typeof data.data).toBe("string");

    validToken = data.data as string;
    // Validasi token berformat UUID
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validToken)
    ).toBe(true);

    // Verifikasi token tersimpan di tabel sessions
    const [savedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, validToken));

    expect(savedSession).toBeDefined();
    expect(savedSession!.token).toBe(validToken);
  });

  it("POST /api/users/login returns error when password is wrong", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "passwordsalah",
        }),
      })
    );

    expect(response.status).toBe(400);
    const data = (await response.json()) as Record<string, any>;
    expect(data).toEqual({ error: "Email atau password salah" });
  });

  it("POST /api/users/login returns error when email is not registered", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tidakada@email.com",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(400);
    const data = (await response.json()) as Record<string, any>;
    expect(data).toEqual({ error: "Email atau password salah" });
  });

  it("GET /api/users/current returns current user profile when authenticated", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as Record<string, any>;
    expect(data.data).toBeDefined();
    expect(data.data.name).toBe("Reyhan");
    expect(data.data.email).toBe(testEmail);
    expect(data.data.id).toBeDefined();
    expect(data.data.created_at).toBeDefined();
    expect(data.data.password).toBeUndefined();
  });

  it("GET /api/users/current returns error 401 when Authorization header is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
    const data = (await response.json()) as Record<string, any>;
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("GET /api/users/current returns error 401 when token is invalid", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-uuid-token",
        },
      })
    );

    expect(response.status).toBe(401);
    const data = (await response.json()) as Record<string, any>;
    expect(data).toEqual({ error: "Unauthorized" });
  });
});
