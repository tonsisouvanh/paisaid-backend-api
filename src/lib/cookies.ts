import { Response } from "express";

export const ACCESS_TOKEN_COOKIE_MAX_AGE_PROD = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_COOKIE_MAX_AGE_PROD = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ACCESS_TOKEN_COOKIE_MAX_AGE_DEV = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_COOKIE_MAX_AGE_DEV = 24 * 60 * 60 * 1000; // 1 hour

export const setAccessTokenCookie = (
  res: Response,
  accessToken: string
): void => {
  res.cookie("access_token", accessToken, {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? "devton.xyz" : undefined,
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
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? "devton.xyz" : undefined,
    path: "/",
    maxAge:
      process.env.NODE_ENV === "production"
        ? REFRESH_TOKEN_COOKIE_MAX_AGE_PROD
        : REFRESH_TOKEN_COOKIE_MAX_AGE_DEV,
  });
};

export const clearAccessToken = (res: Response): void => {
  res.clearCookie("access_token", {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? "devton.xyz" : undefined,
    path: "/",
  });
};

export const clearRefreshToken = (res: Response): void => {
  res.clearCookie("refresh_token", {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? "devton.xyz" : undefined,
    path: "/",
  });
};
