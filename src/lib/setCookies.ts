import { Response } from "express";
export const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
// const REFRESH_TOKEN_COOKIE_MAX_AGE = 15000; // 15s
export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
): void => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production" ? ".recruit.devton.xyz" : undefined, // Allow access across subdomains
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
};
