import { Router } from "express";
import { asyncWrap } from "../middleware/async-wrap.js";

const router = Router();

router.get(
  "/api/health",
  asyncWrap(async (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }),
);

export default router;
