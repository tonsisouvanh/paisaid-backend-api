import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { generateTokens } from "../lib/generateTokens";
import prisma from "../lib/prisma";
import { setRefreshTokenCookie } from "../lib/setCookies";
import { getLocalDateTime } from "../lib/utils";
import { authenticate } from "../middleware/authMiddleware";

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

    // Set refresh token in HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: "Login successful",
      accessToken,
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
    const { userId, roleId } = req.user;
    const { accessToken, refreshToken } = generateTokens({
      userId: userId,
      roleId: roleId,
      role: req.user.role,
    });

    // Store the new refresh token in the database
    // await prisma.token.create({
    //   data: {
    //     userId,
    //     token: refreshToken,
    //     type: "refresh",
    //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    //   },
    // });

    // Set the new refresh token in HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    // Send the new access token in the response
    res.json({ accessToken });
  } catch (error) {
    next(error);
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
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        lastLoginAt: getLocalDateTime(),
      },
    });

    // Clear the refresh token cookie
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? ".recruit.devton.xyz"
          : undefined, // Allow access across subdomains
    });

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error signing out:", error);
    next(error);
  }
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
      menus = user.role.roleMenus.map((rm) => ({
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

export const getUserMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await authenticate(req, res, async () => {
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
