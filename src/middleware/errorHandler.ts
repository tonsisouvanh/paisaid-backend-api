import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { handlePrismaError } from "../lib/utils";

interface CustomError extends Error {
  status?: number;
  code?: string;
}

export const ResponseHandle = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // const uuid = randomString();

  //Request
  // logger.debug(`${req.method}: ${req.path} =========> ${uuid}`);
  // logger.info(`REQUEST ${uuid}:`, JSON.stringify(req.body));

  //Response
  const originalSend = res.send;
  res.send = (data: any): Response => {
    // logger.info(`RESPONSE ${uuid}:`, data);
    return originalSend.call(res, data);
  };

  next();
};

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  console.error("Error:", err);

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    return res.status(prismaError.statusCode || 500).json({
      success: false,
      message: prismaError.message,
      timestamp: new Date().toISOString(),
      error: {
        code: err.code,
        details: err.message,
      },
    });
  }

  // Handle other errors
  const statusCode = err.status || 500;
  const message = err.message || "An unexpected error occurred";

  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
    error: {
      code: "SERVER_ERROR",
      details: err.message,
    },
  });
};
