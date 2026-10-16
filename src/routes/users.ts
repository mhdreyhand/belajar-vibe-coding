import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    return await db.select().from(users);
  })
  .post(
    "/",
    async ({ body, set }) => {
      const [result] = await db.insert(users).values(body);
      set.status = 201;
      return {
        success: true,
        data: {
          id: result.insertId,
          ...body,
        },
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  );
