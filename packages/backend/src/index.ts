import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import productRouter from "./routes/products.js";
import orderRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import viajanteRouter from "./routes/viajante.js";
import { globalErrorHandler } from "./middleware/error.js";

const app: Express = express();

const isVercel = !!process.env.VERCEL;

app.use(
  cors({
    origin: isVercel ? true : env.FRONTEND_URL,
  }),
);
app.use(express.json());

// Routes
app.use(healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/viajante", viajanteRouter);

// 404 catch-all for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    statusCode: 404,
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

if (!isVercel) {
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
  });
}

export default app;
