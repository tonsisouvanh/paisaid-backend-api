import { Response } from "express";

export const ACCESS_TOKEN_COOKIE_MAX_AGE_PROD = 15 * 60 * 1000; // 15 minutes = 15 * 60 * 1000
export const REFRESH_TOKEN_COOKIE_MAX_AGE_PROD = 7 * 24 * 60 * 60 * 1000; // 7 days = 7 * 24 * 60 * 60 * 1000
export const ACCESS_TOKEN_COOKIE_MAX_AGE_DEV = 3 * 60 * 1000; // 3 minutes
export const REFRESH_TOKEN_COOKIE_MAX_AGE_DEV = 60 * 60 * 1000; // 1 hour

export const setAccessTokenCookie = (
  res: Response,
  accessToken: string
): void => {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge:
      process.env.NODE_ENV === "production"
        ? ACCESS_TOKEN_COOKIE_MAX_AGE_PROD
        : ACCESS_TOKEN_COOKIE_MAX_AGE_DEV,
  });
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
): void => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge:
      process.env.NODE_ENV === "production"
        ? REFRESH_TOKEN_COOKIE_MAX_AGE_PROD
        : REFRESH_TOKEN_COOKIE_MAX_AGE_DEV,
  });
};

export const clearAccressToken = (res: Response): void => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};
export const clearRefreshToken = (res: Response): void => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};

// // Generate a CSRF token and set it in a cookie
// export const generateCsrfToken = (res: Response): string => {
//   const csrfToken = crypto.randomBytes(32).toString("hex");
//   res.cookie("csrf_token", csrfToken, {
//     secure: process.env.NODE_ENV === "production",
//     sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//     path: "/",
//   });
//   return csrfToken;
// };

// // Middleware to verify CSRF token
// export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
//   const csrfToken = req.cookies.csrf_token;
//   const clientCsrfToken = req.headers["x-csrf-token"] || req.body.csrfToken;

//   if (!csrfToken || !clientCsrfToken || csrfToken !== clientCsrfToken) {
//     return res.status(403).json({ message: "Invalid CSRF token" });
//   }

//   next();
// };
