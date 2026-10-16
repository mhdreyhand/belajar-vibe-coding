import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Elysia App API", () => {
  it("GET / returns welcome message", async () => {
    const response = await app.handle(new Request("http://localhost:3000/"));
    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, any>;
    expect(data.message).toBe("Welcome to Elysia + Bun + Drizzle + MySQL API");
    expect(data.healthCheck).toBe("/health");
  });

  it("GET /health returns health status", async () => {
    const response = await app.handle(new Request("http://localhost:3000/health"));
    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, any>;
    expect(data.status).toBe("ok");
    expect(data.database).toBeDefined();
  });
});
