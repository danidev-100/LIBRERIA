import { Router } from "express";
import { z } from "zod";
import { AppError } from "../middleware/error.js";
import { asyncWrap } from "../middleware/async-wrap.js";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { generateOrderInvoice } from "../lib/pdf-generator.js";

const router = Router();

// --- Schemas ---

const itemSchema = z.object({
  productCode: z.string().min(1, "productCode is required"),
  quantity: z.number().int().positive("quantity must be a positive integer"),
  details: z.string().max(500).optional(),
});

const createOrderSchema = z.object({
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// --- POST /api/orders ---

router.post(
  "/",
  requireAuth,
  asyncWrap(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const body = parsed.data;
    const codes = body.items.map((i) => i.productCode);

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
          userId: req.user!.id,
          total,
          items: {
            create: orderItemsData,
          },
        },
        include: {
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

// --- GET /api/orders ---

router.get(
  "/",
  requireAuth,
  asyncWrap(async (req, res) => {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    const userId = req.user!.id;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: { product: true },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    res.json({
      orders: orders.map((o) => mapOrderWithItems(o)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),
);

// --- GET /api/orders/:id ---

router.get(
  "/:id",
  requireAuth,
  asyncWrap(async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, "Invalid order ID");

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    // Ownership check: must be own order OR admin
    if (order.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(403, "You do not have access to this order");
    }

    res.json({ order: mapOrderWithItems(order) });
  }),
);

// --- GET /api/orders/:id/pdf ---

router.get(
  "/:id/pdf",
  requireAuth,
  asyncWrap(async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, "Invalid order ID");

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    // Ownership check: must be own order OR admin
    if (order.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(403, "You do not have access to this order");
    }

    const pdfBuffer = await generateOrderInvoice(order);

    const disposition =
      req.query.inline === "true" ? "inline" : "attachment";

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="order-${order.id}.pdf"`,
    });
    res.send(pdfBuffer);
  }),
);

// --- Helpers ---

function mapOrderWithItems(order: {
  id: number;
  userId: number;
  status: string;
  total: { toNumber?: () => number };
  createdAt: Date;
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

export default router;
