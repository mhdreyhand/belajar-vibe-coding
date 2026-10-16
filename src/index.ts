import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/users";

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    message: "Welcome to Elysia + Bun + Drizzle + MySQL API",
    version: "1.0.0",
    healthCheck: "/health",
  }))
  .use(healthRoutes)
  .use(userRoutes)
  .listen(port);

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
