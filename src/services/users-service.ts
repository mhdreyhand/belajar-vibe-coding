import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export class UserRegistrationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserRegistrationError";
    this.status = status;
  }
}

export const usersService = {
  async registerUser(input: RegisterUserInput) {
    // 1. Cek apakah email sudah terdaftar
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new UserRegistrationError("Email sudah terdaftar", 400);
    }

    // 2. Hash password menggunakan bcrypt
    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan data user ke database
    try {
      await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
      });
    } catch (error: any) {
      // Antisipasi jika terjadi duplicate key constraint saat race condition
      if (
        error?.code === "ER_DUP_ENTRY" ||
        error?.message?.includes("Duplicate entry") ||
        error?.message?.includes("users_email_unique")
      ) {
        throw new UserRegistrationError("Email sudah terdaftar", 400);
      }
      throw error;
    }

    return { data: "OK" };
  },
};
