import { Request, Response, NextFunction } from "express";

export function requireViajante(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "VIAJANTE") {
    res.status(403).json({ error: "Viajante access required", statusCode: 403 });
    return;
  }
  next();
}
