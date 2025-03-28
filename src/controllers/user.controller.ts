import { Prisma, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime, handlePrismaError } from "../lib/utils";
import { DEFAULT_PASSWORD } from "../config/const";

// Define the query parameters interface
interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
}

// Function to construct the Prisma where filter based on query parameters
const queryFilter = (queryParams: QueryParams): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {};

  if (queryParams.q) {
    where.OR = [
      { name: { contains: queryParams.q } },
      { email: { contains: queryParams.q } },
      { phone: { contains: queryParams.q } },
      { username: { contains: queryParams.q } },
    ];
  }

  if (queryParams.email) {
    where.email = { contains: queryParams.email };
  }

  if (queryParams.phone) {
    where.phone = { contains: queryParams.phone };
  }

  if (queryParams.status) {
    where.status = queryParams.status as UserStatus;
  }

  if (queryParams.role) {
    where.role = { name: { contains: queryParams.role } };
  }

  return where;
};

// ##################################################################### //
// ############ // Get user list | GET /api/v1/users/listing ########### //
// #################### Private | Role: admin #################### //
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: QueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "0", 10),
    q: searchParams.get("q") || "",
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    status: searchParams.get("status") || "",
    role: searchParams.get("role") || "",
  };
  const where = queryFilter(queryParams);

  try {
    // Count the total number of users matching the filter
    const totalElements = await prisma.user.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    // Fetch the users from the database with pagination
    const userData = await prisma.user.findMany({
      where,
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
      include: {
        role: true, // Include role information
      },
    });

    // Return the response with meta information and user data
    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
        q: queryParams.q,
      },
      data: userData,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    next(error); // Pass the error to the error handler middleware
  }
};

// ##################################################################### //
// ############## Create user | POST: /api/v1/users/create ############# //
// ##################### Private | Role: admin ####################### //
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    username,
    email,
    password,
    name,
    gender,
    address,
    phone,
    roleId,
    dob,
    isActive,
  } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, email ? { email } : {}],
      },
    });

    if (existingUser) {
      res.status(409).json({
        status: "error",
        message: "User already exists",
      });
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        address,
        gender: gender ?? "other",
        phone,
        isActive: isActive ?? false,
        roleId: roleId || 1,
        dob: dob ? new Date(dob) : undefined,
      },
    });
    res.status(201).json({
      success: true,
      message: "User created successfully",
      timestamp: new Date().toISOString(),
      data: user,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    next(error);
  }
};

// ##################################################################### //
// ############# Get user by id | GET /api/v1/users/one/:id ############ //
// ####################### Private | Role: admin ####################### //
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    next(error);
  }
};

// ##################################################################### //
// ############### Edit user | PUT /api/v1/users/:id/edit ############## //
// #################### Private | Role: admin ######################### //
export const editUser = async (req: Request, res: Response): Promise<any> => {
  const userId = parseInt(req.params.id, 10);
  const {
    username,
    email,
    name,
    phone,
    roleId,
    dob,
    status,
    address,
    isActive,
  } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email,
        name,
        isActive: isActive ?? false,
        phone,
        dob: getLocalDateTime(new Date(dob)),
        roleId,
        status: status?.toUpperCase() as UserStatus,
        address,
      },
    });
    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "User name already exists",
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to update user",
    });
  }
};

// ##################################################################### //
// ######### Hard Delete User | DELETE /api/v1/users/:id/delete ######## //
// ##################### Private | Role: admin ###################### //
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    next(error); // Pass the error to the error handler middleware
  }
};

// ##################################################################### //
// ####### Reset password | POST /api/v1/users/:id/reset-password ###### //
// ######################## Private | Role: admin ###################### //
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const userId = parseInt(req.params.id, 10);
  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Update the user's password in the database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password has been reset to default",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    next(error); // Pass the error to the error handler middleware
  }
};
