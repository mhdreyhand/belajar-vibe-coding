import { Elysia, t } from "elysia";
import { usersService, UserRegistrationError } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await usersService.registerUser(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error instanceof UserRegistrationError) {
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
  );
