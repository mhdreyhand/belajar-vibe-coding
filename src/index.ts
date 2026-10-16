import { Elysia } from "elysia";
import { healthRoute } from "./routes/health-route";
import { usersRoute } from "./routes/users-route";

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    message: "Welcome to Elysia + Bun + Drizzle + MySQL API",
    version: "1.0.0",
    healthCheck: "/health",
  }))
  .use(healthRoute)
  .group("/api", (api) => api.use(usersRoute))
  .listen(port);

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
