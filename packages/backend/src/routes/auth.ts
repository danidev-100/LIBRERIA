import { Router } from "express";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";
import { asyncWrap } from "../middleware/async-wrap.js";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// --- Helpers ---

function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join("; ");
    throw new AppError(400, messages);
  }
  return result.data;
}

// --- Schemas ---

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// --- POST /register ---

router.post(
  "/register",
  asyncWrap(async (req, res) => {
    const body = validate(registerSchema, req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      res.status(409).json({ error: "Email already registered", statusCode: 409 });
      return;
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(201).json({ user });
  }),
);

// --- POST /login ---

router.post(
  "/login",
  asyncWrap(async (req, res) => {
    const body = validate(loginSchema, req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password", statusCode: 401 });
      return;
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password", statusCode: 401 });
      return;
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"] },
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }),
);

// --- GET /me ---

router.get(
  "/me",
  requireAuth,
  asyncWrap(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found", statusCode: 404 });
      return;
    }

    res.status(200).json({ user });
  }),
);

export default router;
