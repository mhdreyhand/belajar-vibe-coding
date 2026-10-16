import { Elysia, t } from "elysia";
import { usersService, AuthError } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await usersService.registerUser(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error instanceof AuthError) {
          set.status = error.status;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error?.message || "Terjadi kesalahan internal server" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await usersService.loginUser(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error instanceof AuthError) {
          set.status = error.status;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error?.message || "Terjadi kesalahan internal server" };
      }
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const result = await usersService.getCurrentUser(token);
      set.status = 200;
      return result;
    } catch (error: any) {
      if (error instanceof AuthError) {
        set.status = error.status;
        return { error: error.message };
      }
      set.status = 500;
      return { error: error?.message || "Terjadi kesalahan internal server" };
    }
  });
