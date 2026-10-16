import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export class UserRegistrationError extends AuthError {
  constructor(message: string, status = 400) {
    super(message, status);
    this.name = "UserRegistrationError";
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

  async loginUser(input: LoginUserInput) {
    // 1. Cari user berdasarkan email
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw new AuthError("Email atau password salah", 400);
    }

    // 2. Verifikasi password dengan hash bcrypt
    const isPasswordValid = await Bun.password.verify(input.password, user.password);
    if (!isPasswordValid) {
      throw new AuthError("Email atau password salah", 400);
    }

    // 3. Generate token UUID
    const token = crypto.randomUUID();

    // 4. Simpan sesi login ke tabel sessions
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { data: token };
  },

  async getCurrentUser(token: string) {
    const [result] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (!result) {
      throw new AuthError("Unauthorized", 401);
    }

    return { data: result };
  },
};
