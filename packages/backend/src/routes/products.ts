import { Router } from "express";
import { z } from "zod";
import { AppError } from "../middleware/error.js";
import { asyncWrap } from "../middleware/async-wrap.js";
import prisma from "../lib/prisma.js";

const router = Router();

// --- GET /api/products ---

router.get(
  "/",
  asyncWrap(async (req, res) => {
    const querySchema = z.object({
      search: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { search, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: products.map((p) => ({ ...p, price: Number(p.price) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),
);

// --- GET /api/products/:code ---

router.get(
  "/:code",
  asyncWrap(async (req, res) => {
    const code = req.params.code as string;

    const product = await prisma.product.findUnique({
      where: { code },
    });

    if (!product) {
      throw new AppError(404, `Product with code '${code}' not found`);
    }

    res.json({ product: { ...product, price: Number(product.price) } });
  }),
);

export default router;
