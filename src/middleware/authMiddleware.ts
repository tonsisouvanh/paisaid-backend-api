// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import prisma from "../lib/prisma";

// // Extend the Request interface to include the user property
// declare module "express-serve-static-core" {
//   interface Request {
//     user?: any;
//   }
// }

// export const authenticate = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   // Get the token from the request headers
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized: No token provided" });
//   }

//   // Verify the token
//   jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, payload) => {
//     if (err) {
//       // if (err.name === "JsonWebTokenError") {
//       //   return res.status(401).json({ message: "Unauthorized: Token expired" });
//       // }
//       return res.status(403).json({ message: "Forbidden: Invalid token" });
//     }

//     // Attach the payload to the request object
//     req.user = payload;
//     next();
//   });
// };

// export const verifyRefreshToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   // Get the refresh token from cookies
//   const refreshToken = req.cookies.refresh_token;
//   if (!refreshToken) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: No refresh token provided" });
//   }

//   // Verify the refresh token
//   jwt.verify(
//     refreshToken,
//     process.env.JWT_REFRESH_SECRET as string,
//     async (err: any, payload: any) => {
//       if (err) {
//         return res
//           .status(403)
//           .json({ message: "Forbidden: Invalid refresh token" });
//       }

//       // // Check if the refresh token exists in the database
//       // const storedToken = await prisma.token.findUnique({
//       //   where: { token: refreshToken },
//       // });
//       // if (!storedToken) {
//       //   return res
//       //     .status(403)
//       //     .json({ message: "Forbidden: Refresh token not found" });
//       // }

//       // Attach the payload to the request object
//       req.user = payload;
//       next();
//     }
//   );
// };

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Extend the Request interface to include the user property
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  // Get the token from the request headers
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, payload) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized: Token expired" });
      }
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }

    // Attach the payload to the request object
    req.user = payload;
    next();
  });
};

export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  // Get the token from the request headers
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next();
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, payload) => {
    if (payload) {
      // Attach the payload to the request object
      req.user = payload;
    }
  });
  next();
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
      .status(401)
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

      // // Check if the refresh token exists in the database
      // const storedToken = await prisma.token.findUnique({
      //   where: { token: refreshToken },
      // });
      // if (!storedToken) {
      //   return res
      //     .status(403)
      //     .json({ message: "Forbidden: Refresh token not found" });
      // }

      // Attach the payload to the request object
      req.user = payload;
      next();
    }
  );
};
