import { Request, Response, NextFunction } from "express";
const filesPayloadExists = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.files) {
    res.status(400).json({ status: "error", message: "Missing files" });
    return;
  }

  next();
};

export default filesPayloadExists;
