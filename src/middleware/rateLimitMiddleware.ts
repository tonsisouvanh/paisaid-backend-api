import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
// Reusable rate limiter factory
const rateLimiterMiddleware = (options: any = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = "Too many requests, please try again later.",
    keyGenerator = (req: Request) => req.ip, // Default to IP
  } = options;
  return rateLimit({
    windowMs,
    max,
    message: (req: Request, res: Response) => ({
      error: "Rate limit exceeded",
      message,
      retryAfter: Math.ceil(((res.getHeader("X-RateLimit-Reset") as number) * 1000 - Date.now()) / 1000),
    }),
    keyGenerator,
    headers: true, // Include X-RateLimit-* headers
    handler: (req, res, next, options) => {
      res.status(429).json(options.message(req, res));
    },
  });
};
export default rateLimiterMiddleware;
