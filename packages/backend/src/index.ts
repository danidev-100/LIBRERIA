import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.js";
import { globalErrorHandler } from "./middleware/error.js";

const app: Express = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
app.use(express.json());

// Routes
app.use(healthRouter);

// 404 catch-all for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    statusCode: 404,
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
});

export default app;
