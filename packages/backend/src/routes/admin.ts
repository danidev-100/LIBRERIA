import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { unlinkSync } from "node:fs";
import os from "node:os";
import { AppError } from "../middleware/error.js";
import { asyncWrap } from "../middleware/async-wrap.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import prisma from "../lib/prisma.js";
import { parsePriceList } from "../lib/parse-price-list.js";

const router = Router();

// --- Multer config for TXT upload ---

const upload = multer({ dest: os.tmpdir() });

// --- Status Transition Map ---

const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const validStatuses = Object.keys(transitions);

// --- Helpers ---

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

function mapOrderWithItems(order: {
  id: number;
  userId: number;
  status: string;
  total: { toNumber?: () => number };
  createdAt: Date;
  user: { id: number; name: string; email: string } | null;
  items: Array<{
    id: number;
    orderId: number;
    productCode: string;
    quantity: number;
    unitPrice: { toNumber?: () => number };
    details: string | null;
    product: { code: string; description: string; price: { toNumber?: () => number }; isActive: boolean; lastUpdate: Date | null; createdAt: Date; updatedAt: Date };
  }>;
}) {
  return {
    ...order,
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      details: item.details,
      product: { ...item.product, price: Number(item.product.price) },
    })),
  };
}

// --- GET /api/admin/orders ---

router.get(
  "/orders",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const querySchema = paginationSchema.extend({
      status: z.string().optional(),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    if (status && !validStatuses.includes(status)) {
      throw new AppError(400, `Invalid status '${status}'. Valid values: ${validStatuses.join(", ")}`);
    }

    const where = status ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders: orders.map((o) => mapOrderWithItems(o)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),
);

// --- PATCH /api/admin/orders/:id/status ---

router.patch(
  "/orders/:id/status",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, "Invalid order ID");

    const bodySchema = z.object({
      status: z.string().min(1, "status is required"),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { status: newStatus } = parsed.data;

    if (!validStatuses.includes(newStatus)) {
      throw new AppError(400, `Invalid status '${newStatus}'. Valid values: ${validStatuses.join(", ")}`);
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError(404, "Order not found");

    const allowed = transitions[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        400,
        `Invalid status transition from '${order.status}' to '${newStatus}'`,
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: newStatus as any },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    res.json({ order: mapOrderWithItems(updated) });
  }),
);

// --- GET /api/admin/users ---

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  }),
);

// =============================================================================
// Admin Product CRUD Routes
// =============================================================================

// --- Zod schemas ---

const createProductSchema = z.object({
  code: z.string().length(8, "Code must be exactly 8 characters"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be >= 0"),
  category: z.string().optional(),
});

const updateProductSchema = z.object({
  description: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// --- GET /api/admin/products ---

router.get(
  "/products",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const querySchema = paginationSchema.extend({
      search: z.string().optional(),
      isActive: z.enum(["true", "false"]).optional(),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { search, isActive, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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

// --- POST /api/admin/products ---

router.post(
  "/products",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { code, description, price } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(409, `Product with code ${code} already exists`);
    }

    const product = await prisma.product.create({
      data: { code, description, price },
    });

    res.status(201).json({ product: { ...product, price: Number(product.price) } });
  }),
);

// --- POST /api/admin/products/upload (MUST be before /products/:code) ---

router.post(
  "/products/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  asyncWrap(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, "No file uploaded");
    }

    if (!req.file.originalname.endsWith(".txt")) {
      unlinkSync(req.file.path);
      throw new AppError(400, "Only .txt files are supported");
    }

    let products: ReturnType<typeof parsePriceList>;
    try {
      products = parsePriceList(req.file.path);
    } catch (err) {
      unlinkSync(req.file.path);
      throw new AppError(400, `Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Pre-fetch existing codes for inserted vs updated tracking
    const existingCodes = new Set(
      (await prisma.product.findMany({ select: { code: true } })).map((p) => p.code),
    );

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const p of products) {
      try {
        await prisma.product.upsert({
          where: { code: p.code },
          update: {
            description: p.description,
            price: p.price,
            isActive: p.isActive,
            lastUpdate: p.lastUpdate,
          },
          create: {
            code: p.code,
            description: p.description,
            price: p.price,
            isActive: p.isActive,
            lastUpdate: p.lastUpdate,
          },
        });

        if (existingCodes.has(p.code)) {
          updated++;
        } else {
          inserted++;
        }
      } catch (err) {
        errors.push(`Error processing product ${p.code}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Clean up temp file
    try {
      unlinkSync(req.file.path);
    } catch {
      // Ignore cleanup errors
    }

    res.json({ inserted, updated, total: products.length, errors });
  }),
);

// --- PUT /api/admin/products/:code ---

router.put(
  "/products/:code",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const { code } = req.params as { code: string };

    const existing = await prisma.product.findUnique({ where: { code } });
    if (!existing) {
      throw new AppError(404, "Product not found");
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { description, price, isActive } = parsed.data;
    const data: Record<string, unknown> = {};
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price;
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({
      where: { code },
      data,
    });

    res.json({ product: { ...product, price: Number(product.price) } });
  }),
);

// --- DELETE /api/admin/products/:code (soft delete) ---

router.delete(
  "/products/:code",
  requireAuth,
  requireAdmin,
  asyncWrap(async (req, res) => {
    const { code } = req.params as { code: string };

    const existing = await prisma.product.findUnique({ where: { code } });
    if (!existing) {
      throw new AppError(404, "Product not found");
    }

    if (!existing.isActive) {
      throw new AppError(400, "Product is already inactive");
    }

    const product = await prisma.product.update({
      where: { code },
      data: { isActive: false },
    });

    res.json({ product: { ...product, price: Number(product.price) }, deactivated: true });
  }),
);

export default router;
