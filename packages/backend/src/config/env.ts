import { z } from "zod";
import dotenv from "dotenv";

// Don't fail if .env doesn't exist (Vercel provides env vars directly)
dotenv.config({ path: ".env" });

const isVercel = !!process.env.VERCEL;

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: isVercel
    ? z.string().url().optional().default("http://localhost:5173")
    : z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  ADMIN_EMAIL: isVercel
    ? z.string().email().optional().default("admin@libreria.com")
    : z.string().email(),
  ADMIN_PASSWORD: isVercel
    ? z.string().min(6).optional().default("admin123")
    : z.string().min(6),
  ADMIN_NAME: isVercel
    ? z.string().min(1).optional().default("Admin")
    : z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
