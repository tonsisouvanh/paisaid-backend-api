import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime, handlePrismaError } from "../lib/utils";

// Define the query parameters interface
interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

// Function to construct the Prisma where filter based on query parameters
const queryFilter = (queryParams: QueryParams): Prisma.RoleWhereInput => {
  const where: Prisma.RoleWhereInput = {};

  if (queryParams.q) {
    where.OR = [{ name: { contains: queryParams.q } }];
  }

  return where;
};

// ##################################################################### //
// ############## Get role list | GET: /api/v1/roles/list ############## //
// ##################### Private | Role: Admin ####################### //
export const getRoles = async (req: Request, res: Response): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: QueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "0", 10),
    q: searchParams.get("q") || "",
  };
  const where = queryFilter(queryParams);

  try {
    // Count the total number of roles matching the filter
    const totalElements = await prisma.role.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    // Fetch the roles from the database with pagination
    const roleData = await prisma.role.findMany({
      where,
      include: {
        roleMenus: {
          include: {
            menu: true,
          },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
    });

    // Return the response with meta information and role data
    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
        q: queryParams.q,
      },
      data: roleData,
    });
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Title already exists",
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVER_ERROR",
        details: error.message || "An unexpected error occurred.",
      },
    });
  }
};

// ##################################################################### //
// ############## Get role by id | GET: /api/v1/roles/:id ############## //
// ##################### Private | Role: Admin ####################### //
export const getRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        roleMenus: {
          include: { menu: true },
        },
      },
    });

    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }
    return res.status(200).json({
      success: true,
      message: "Role retrieved successfully",
      timestamp: new Date().toISOString(),
      data: role,
    });
  } catch (error: any) {
    console.error("Error fetching role:", error);
    next(error);
  }
};

// ##################################################################### //
// ############## Create role | POST: /api/v1/roles/create ############# //
// ##################### Private | Role: Admin ####################### //
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { name, description, isActive, slug } = req.body;
  try {
    const role = await prisma.role.create({
      data: {
        name,
        slug,
        description,
        isActive: isActive ?? true,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
      },
    });
    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      timestamp: new Date().toISOString(),
      data: role,
    });
  } catch (error: any) {
    console.error("Error creating role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Role already exists",
        });
      }
    }
    next(error);
  }
};
// ##################################################################### //
// ## Create role with permission | POST /roles/create-with-permission # //
// ##################################################################### //
export const createRoleWithPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { name, description, isActive, slug, permissions } = req.body;
  try {
    const role = await prisma.role.create({
      data: {
        name,
        slug,
        description,
        rolePermissions: {
          createMany: {
            data: permissions.map((permissionId: number) => ({
              permissionId,
            })),
          },
        },
        isActive: isActive ?? true,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      timestamp: new Date().toISOString(),
      data: role,
    });
  } catch (error: any) {
    console.error("Error creating role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Role already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ########### Edit Role by ID | PUT: /api/v1/roles/:id/edit ########### //
// ############## Private | Role: Admin ################## //
export const editRole = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, slug, description, isActive } = req.body;
  try {
    const role = await prisma.role.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        description,
        isActive: isActive ?? true,
        slug,
        updatedAt: getLocalDateTime(),
      },
    });
    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      timestamp: new Date().toISOString(),
      data: role,
    });
  } catch (error: any) {
    console.error("Error updating role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Role not found",
        });
      }
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Role name already exists",
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to update role",
    });
  }
};

// ##################################################################### //
// # Edit role by id with permission | PUT /roles/edit-with-permission # //
// ##################################################################### //
export const editRoleWithPermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  const id = parseInt(req.params.id);
  const { name, slug, description, isActive, permissions } = req.body;
  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        isActive: isActive ?? true,
        updatedAt: getLocalDateTime(),
        rolePermissions: {
          deleteMany: {
            roleId: id,
          },
          createMany: {
            data: permissions.map((permissionId: number) => ({
              permissionId,
            })),
          },
        },
      },
    });

    // Delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Create new permissions
    await prisma.rolePermission.createMany({
      data: permissions.map((permissionId: number) => ({
        roleId: id,
        permissionId,
      })),
    });

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      timestamp: new Date().toISOString(),
      data: role,
    });
  } catch (error: any) {
    console.error("Error updating role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Role not found",
        });
      }
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Role name already exists",
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to update role",
    });
  }
};

// ##################################################################### //
// ##### Hard delete role by ID | DELETE: /api/v1/roles/:id/delete ##### //
// ############ Private | Role: Admin ############### //
export const deleteRole = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.role.delete({ where: { id: parseInt(id, 10) } });
    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Role not found",
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to delete role",
    });
  }
};
