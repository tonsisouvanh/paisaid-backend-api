import { NextFunction, Request, Response } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";

// Extend the Request interface to include the user property
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // Get the access token from cookies or Authorization header
    let accessToken = req.cookies?.access_token;
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    }

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "No access token provid" });
    }

    // Verify the access token
    const payload = (await jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string
    )) as any;

    // Validate the payload structure
    if (!payload.userId || !payload.roleId) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Access toke is invalid" });
    }

    // Set the user payload and proceed
    req.user = payload;
    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      // Access token expired; let the Axios interceptor handle refreshing
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Access token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      // Invalid access token
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Invalid access token MDW" });
    }

    console.error("Error verifying JWT:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyJWTOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    let accessToken = req.cookies?.access_token;
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    }

    if (!accessToken) {
      return next();
    }

    const payload = (await jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string
    )) as any;

    if (!payload.userId || !payload.roleId) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Access token is invalid" });
    }

    req.user = payload;
    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Access token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Invalid access token" });
    }

    console.error("Error verifying optional JWT:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  // Get the refresh token from cookies
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res
      .status(403)
      .json({ message: "Unauthorized: No refresh token provided" });
  }

  // Verify the refresh token
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string,
    async (err: any, payload: any) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Forbidden: Invalid refresh token" });
      }

      // Attach the payload to the request object
      req.user = payload;
      next();
    }
  );
};
