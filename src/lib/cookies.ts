// import { Response } from "express";

// export const ACCESS_TOKEN_COOKIE_MAX_AGE_PROD = 15 * 60 * 1000; // 15 minutes = 15 * 60 * 1000
// export const REFRESH_TOKEN_COOKIE_MAX_AGE_PROD = 7 * 24 * 60 * 60 * 1000; // 7 days = 7 * 24 * 60 * 60 * 1000
// export const ACCESS_TOKEN_COOKIE_MAX_AGE_DEV = 3 * 60 * 1000; // 3 minutes
// export const REFRESH_TOKEN_COOKIE_MAX_AGE_DEV = 60 * 60 * 1000; // 1 hour

// const COOKIE_DOMAIN =
//   process.env.NODE_ENV === "production"
//     ? ".paisaid-cms.netlify.app"
//     : "localhost";

// export const setAccessTokenCookie = (
//   res: Response,
//   accessToken: string
// ): void => {
//   res.cookie("access_token", accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     domain:
//       process.env.NODE_ENV === "production"
//         ? ".paisaid-backend-api.onrender.com"
//         : undefined, // Allow access across subdomains

//     maxAge:
//       process.env.NODE_ENV === "production"
//         ? ACCESS_TOKEN_COOKIE_MAX_AGE_PROD
//         : ACCESS_TOKEN_COOKIE_MAX_AGE_DEV,
//   });
// };

// export const setRefreshTokenCookie = (
//   res: Response,
//   refreshToken: string
// ): void => {
//   res.cookie("refresh_token", refreshToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     domain:
//       process.env.NODE_ENV === "production"
//         ? ".paisaid-backend-api.onrender.com"
//         : undefined, // Allow access across subdomains

//     maxAge:
//       process.env.NODE_ENV === "production"
//         ? REFRESH_TOKEN_COOKIE_MAX_AGE_PROD
//         : REFRESH_TOKEN_COOKIE_MAX_AGE_DEV,
//   });
// };

// export const clearAccessToken = (res: Response): void => {
//   res.clearCookie("access_token", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     domain:
//       process.env.NODE_ENV === "production"
//         ? ".paisaid-backend-api.onrender.com"
//         : undefined, // Allow access across subdomains
//   });
// };
// export const clearRefreshToken = (res: Response): void => {
//   res.clearCookie("refresh_token", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     domain:
//       process.env.NODE_ENV === "production"
//         ? ".paisaid-backend-api.onrender.com"
//         : undefined, // Allow access across subdomains
//   });
// };

import { Response } from "express";

export const ACCESS_TOKEN_COOKIE_MAX_AGE_PROD = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_COOKIE_MAX_AGE_PROD = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ACCESS_TOKEN_COOKIE_MAX_AGE_DEV = 3 * 60 * 1000; // 3 minutes
export const REFRESH_TOKEN_COOKIE_MAX_AGE_DEV = 60 * 60 * 1000; // 1 hour

export const setAccessTokenCookie = (
  res: Response,
  accessToken: string
): void => {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
    sameSite: "lax",
    path: "/",
    maxAge:
      process.env.NODE_ENV === "production"
        ? REFRESH_TOKEN_COOKIE_MAX_AGE_PROD
        : REFRESH_TOKEN_COOKIE_MAX_AGE_DEV,
  });
};

export const clearAccessToken = (res: Response): void => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const clearRefreshToken = (res: Response): void => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};
