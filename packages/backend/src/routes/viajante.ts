import { Router } from "express";
import { z } from "zod";
import { AppError } from "../middleware/error.js";
import { asyncWrap } from "../middleware/async-wrap.js";
import { requireAuth } from "../middleware/auth.js";
import { requireViajante } from "../middleware/viajante.js";
import prisma from "../lib/prisma.js";

const router = Router();

// All viajante routes require auth + viajante role
router.use(requireAuth, requireViajante);

// --- Schemas ---

const itemSchema = z.object({
  productCode: z.string().min(1, "productCode is required"),
  quantity: z.number().int().positive("quantity must be a positive integer"),
  details: z.string().max(500).optional(),
});

const createOrderSchema = z.object({
  clientId: z.number().int().positive("clientId is required"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// --- Helpers ---

function mapOrderWithItems(order: {
  id: number;
  userId: number;
  createdById: number | null;
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
    product: { code: string; description: string; price: { toNumber?: () => number } };
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

// --- GET /api/viajante/clients ---
// List all CLIENT users so the viajante can pick one

router.get(
  "/clients",
  asyncWrap(async (req, res) => {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: "CLIENT" },
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.user.count({ where: { role: "CLIENT" } }),
    ]);

    res.json({ clients, total, page, totalPages: Math.ceil(total / limit) });
  }),
);

// --- POST /api/viajante/orders ---
// Create an order on behalf of a client

router.post(
  "/orders",
  asyncWrap(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const body = parsed.data;
    const codes = body.items.map((i) => i.productCode);

    // Verify the client exists and is a CLIENT
    const client = await prisma.user.findUnique({
      where: { id: body.clientId },
      select: { id: true, role: true },
    });

    if (!client) {
      throw new AppError(404, "Client not found");
    }

    if (client.role !== "CLIENT") {
      throw new AppError(400, "User is not a client");
    }

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { code: { in: codes } },
      });

      // Validate all codes exist
      const foundCodes = new Set(products.map((p) => p.code));
      const missing = codes.filter((c) => !foundCodes.has(c));
      if (missing.length > 0) {
        throw new AppError(400, `Products not found: ${missing.join(", ")}`);
      }

      const productMap = new Map(products.map((p) => [p.code, p]));

      // Calculate total server-side
      let total = 0;
      const orderItemsData = body.items.map((item) => {
        const product = productMap.get(item.productCode)!;
        const subtotal = Number(product.price) * item.quantity;
        total += subtotal;
        return {
          productCode: item.productCode,
          quantity: item.quantity,
          unitPrice: product.price,
          details: item.details ?? null,
        };
      });

      return tx.order.create({
        data: {
          userId: body.clientId,
          createdById: req.user!.id,
          total,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: true },
          },
        },
      });
    });

    res.status(201).json({
      order: mapOrderWithItems(order),
    });
  }),
);

// --- GET /api/viajante/orders ---
// List orders created by this viajante

router.get(
  "/orders",
  asyncWrap(async (req, res) => {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    const viajanteId = req.user!.id;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { createdById: viajanteId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: true },
          },
        },
      }),
      prisma.order.count({ where: { createdById: viajanteId } }),
    ]);

    res.json({
      orders: orders.map((o) => mapOrderWithItems(o)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),
);

export default router;
