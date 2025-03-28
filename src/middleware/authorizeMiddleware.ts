import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";

export const authorizePermissions = (...requiredPermissions: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const { userId, roleId } = req.user; // From verifyJWT or verifyRefreshToken
      if (!roleId || !userId) {
        return res.status(403).json({
          message: "Forbidden: No role assigned",
          errorCode: "FORBIDDEN_NO_ROLE_ASSIGNED",
        });
      }

      // Fetch user's role and its permissions
      const role = await prisma.role.findFirst({
        where: {
          users: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      if (!role) {
        return res.status(403).json({
          message: "Forbidden: Role not found",
          errorCode: "FORBIDDEN_ROLE_NOT_FOUND",
        });
      }

      // Admin bypass (optional)
      if (role.name.toLowerCase() === "admin") {
        return next();
      }

      // Extract user's permissions
      const userPermissions = role.rolePermissions.map(
        (rp: any) => rp.permission.action
      );
      // Check if all required permissions are present
      const hasAccess =
        requiredPermissions.length > 0
          ? requiredPermissions.every((perm) => userPermissions.includes(perm))
          : false;
      if (!hasAccess) {
        return res.status(403).json({
          message: "Forbidden: Insufficient permissions",
          errorCode: "FORBIDDEN_INSUFFICIENT_PERMISSION",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
};
