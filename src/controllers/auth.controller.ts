import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { generateTokens } from "../lib/generateTokens";
import prisma from "../lib/prisma";
import { getLocalDateTime } from "../lib/utils";
import { verifyJWT } from "../middleware/authMiddleware";
import {
  clearAccessToken,
  clearRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "../lib/cookies";

// ====================================================== //
// =================== // Sign in user ================== //
// ================// Post /api/auth/signin ============= //
export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // Validate the request body
    const { username, password } = req.body;
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            roleMenus: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(200).json({
        message: "Username is not exist!",
        errorCode: "USERNAME_DOES_NOT_EXIST",
      });
    }

    // Compare the password with the hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password as string
    );
    if (!isPasswordValid) {
      return res.status(200).json({
        message: "Password is incorrect!",
        errorCode: "PASSWORD_IS_INCORRECT",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      roleId: user.roleId,
      role: user.role.slug,
    });

    // Store the refresh token in the database
    // await prisma.token.create({
    //   data: {
    //     userId: user.id,
    //     token: refreshToken,
    //     type: "refresh",
    //     expiresAt: new Date(Date.now() + REFRESH_TOKEN_COOKIE_MAX_AGE), // 7 days
    //   },
    // });

    // Set both tokens in HTTP-only cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: "Login successful",
      user: {
        username: user.username,
        name: user.name,
        role: user.role.slug,
        menuItems: user.role.roleMenus,
      },
    });
  } catch (error) {
    console.error("Error signing in:", error);
    next(error);
  }
};

// ====================================================== //
// ================== // Refresh token ================== //
// ==================// Post /api/auth/refresh-token ============= //
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { userId, roleId, role } = req.user;

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId,
      roleId,
      role,
    });

    // Set new tokens in cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    // Optional: Update refresh token in database
    // await prisma.token.update({
    //   where: { userId_token: { userId, token: req.cookies.refresh_token } },
    //   data: { token: newRefreshToken },
    // });

    res.json({ message: "Token refreshed successfully" });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// ====================================================== //
// ================== // Sign out user ================== //
// ===============// Post /api/auth/sign-out ============ //
export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { userId } = req.user; // Retrieved from verifyJWT
    if (userId) {
      // Update user in database (e.g., log sign-out time or status)
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: getLocalDateTime(), // Example: Add a lastSignOut field
          // Add other fields as needed
        },
      });
    }
    // Clear cookies with matching attributes
    clearAccessToken(res);
    clearRefreshToken(res);

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error signing out:", error);
    next(error);
  }
};

export const clearTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const secret = req.headers["x-clear-token-secret"]; // Custom header
    if (secret !== process.env.CLEAR_TOKEN_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    clearAccessToken(res);
    clearRefreshToken(res);

    res.status(200).json({ message: "Tokens cleared successfully" });
  } catch (error) {
    console.error("Error clearing tokens:", error);
    next(error);
  }
};

export const getUserMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyJWT(req, res, async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }, // Adjust based on your JWT payload
        include: {
          role: {
            include: {
              roleMenus: {
                include: { menu: true },
              },
            },
          },
        },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      const menus = user.role.roleMenus.map((rm) => ({
        id: rm.menu.id,
        name: rm.menu.name,
        slug: rm.menu.slug,
        path: rm.menu.path,
        icon: rm.menu.icon,
        parentId: rm.menu.parentId,
        order: rm.menu.order,
      }));

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role.name,
          menus,
        },
      });
    } catch (error) {
      next(error);
    }
  });
};

export const setRefreshToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json({ message: "Refresh token cookie set" });
};

// ====================================================== //
// ================== // Get user profile ================== //
// ===============// Get /api/auth/me ============ //
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        status: true,
        address: true,
        dob: true,
        lastLoginAt: true,
        gender: true,
        createdAt: true,
        phone: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            roleMenus: {
              include: { menu: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", errorCode: "USER_NOT_FOUND" });
    }
    let menus = [];

    // Check if the user is an admin (adjust based on your role configuration)
    if (user.role.name.toLocaleLowerCase() === "admin") {
      // Fetch all menus for admin
      menus = await prisma.menu.findMany({
        orderBy: { order: "asc" }, // Ensure menus are sorted by order
      });
    } else {
      // For non-admin roles, use roleMenus
      menus = user.role.roleMenus.map((rm: any) => ({
        id: rm.menu.id,
        name: rm.menu.name,
        slug: rm.menu.slug,
        path: rm.menu.path,
        icon: rm.menu.icon,
        parentId: rm.menu.parentId,
        order: rm.menu.order,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        menus,
      },
    });
  } catch (error) {
    next(error);
  }
};
