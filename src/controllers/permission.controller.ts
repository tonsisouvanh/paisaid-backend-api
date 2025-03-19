import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime, handlePrismaError, slugify } from "../lib/utils";

// Define the query parameters interface
interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

// Function to construct the Prisma where filter based on query parameters
const queryFilter = (queryParams: QueryParams): Prisma.PermissionWhereInput => {
  const where: Prisma.PermissionWhereInput = {};

  if (queryParams.q) {
    where.OR = [
      { name: { contains: queryParams.q } },
      { action: { contains: queryParams.q } },
    ];
  }

  return where;
};

// ##################################################################### //
// ########### Get permission list | GET: /api/v1/permissions ########## //
// ##################################################################### //
export const getPermissions = async (
  req: Request,
  res: Response
): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: QueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "0", 10),
    q: searchParams.get("q") || "",
  };
  const where = queryFilter(queryParams);

  try {
    // Count the total number of permissions matching the filter
    const totalElements = await prisma.permission.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    // Fetch the permissions from the database with pagination
    const permissionData = await prisma.permission.findMany({
      where,
      include: {
        rolePermissions: {
          select: {
            role: true,
          },
        },
      },
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
    });

    // Flatten the permission data and rename rolePermissions to roles
    const flattenedPermissionData = permissionData.map((permission) => ({
      ...permission,
      rolePermissions: permission.rolePermissions.map((rp) => ({
        roleId: rp.role.id,
        roleName: rp.role.name,
        roleSlug: rp.role.slug,
        roleIsActive: rp.role.isActive,
      })),
    }));

    // Return the response with meta information and permission data
    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
        q: queryParams.q,
      },
      data: flattenedPermissionData,
    });
  } catch (error: any) {
    console.error("Error fetching permissions:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Permission already exists",
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVER_ERROR",
        details: error.message || "An unexpected error occurred.",
      },
    });
  }
};

// ##################################################################### //
// ########### Get permission by id | GET: /api/v1/permissions/:id ###### //
// ##################################################################### //
export const getPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    const permission = await prisma.permission.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        rolePermissions: {
          select: {
            role: true,
          },
        },
      },
    });
    if (!permission) {
      return res.status(404).json({
        status: "error",
        message: "Permission not found",
      });
    }

    const flattenedPermission = {
      ...permission,
      rolePermissions: permission.rolePermissions.map((rp) => ({
        roleId: rp.role.id,
        roleName: rp.role.name,
        roleSlug: rp.role.slug,
        roleIsActive: rp.role.isActive,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Permission retrieved successfully",
      timestamp: new Date().toISOString(),
      data: flattenedPermission,
    });
  } catch (error: any) {
    console.error("Error fetching permission:", error);
    next(error);
  }
};

// ##################################################################### //
// ########### Create permission | POST: /api/v1/permissions/create ##### //
// ##################################################################### //
export const createPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { name, action, description, isActive } = req.body;
  try {
    const permission = await prisma.permission.create({
      data: {
        name,
        action,
        description,
        isActive: isActive ?? false,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
      },
    });
    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      timestamp: new Date().toISOString(),
      data: permission,
    });
  } catch (error: any) {
    console.error("Error creating permission:", error);
    next(error);
  }
};
// ##################################################################### //
// #################### Create permission with roles | POST /api/v1/permissions/create-with-roles ################### //
// ##################################################################### //
export const createPermissionWithRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { name, action, description, isActive, roleIds, resourceId } = req.body;
  try {
    const permission = await prisma.permission.create({
      data: {
        name,
        action,
        description,
        resourceId: resourceId ?? null,
        isActive: isActive ?? false,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
        rolePermissions: roleIds?.length
          ? {
              createMany: {
                data: roleIds.map((roleId: number) => ({
                  roleId,
                })),
              },
            }
          : undefined,
      },
    });
    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      timestamp: new Date().toISOString(),
      data: permission,
    });
  } catch (error: any) {
    console.error("Error creating permission:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Permission already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ########### Edit permission by ID | PUT: /api/v1/permissions/:id ##### //
// ##################################################################### //
export const editPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  const { name, action, description, isActive } = req.body;
  try {
    const permission = await prisma.permission.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        action,
        description,
        isActive,
        updatedAt: getLocalDateTime(),
      },
    });
    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      timestamp: new Date().toISOString(),
      data: permission,
    });
  } catch (error: any) {
    console.error("Error updating permission:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Permission not found",
        });
      }
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Permission already exists",
        });
      }
    }
    next(error);
  }
};
// ##################################################################### //
// ########### Edit permission with roles by ID | PUT: /api/v1/permissions/:id ##### //
// ##################################################################### //
export const editPermissionWithRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const id = parseInt(req.params.id, 10);
  const { name, action, description, isActive, roleIds, resourceId } = req.body;
  try {
    const updateData: Prisma.PermissionUpdateInput = {
      name,
      action,
      description,
      isActive,
      updatedAt: getLocalDateTime(),
    };

    if (roleIds?.length) {
      updateData.rolePermissions = {
        deleteMany: {
          permissionId: id,
        },
        createMany: {
          data: roleIds.map((roleId: number) => ({
            roleId,
          })),
        },
      };
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: { ...updateData, resourceId: resourceId ?? null },
    });

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      timestamp: new Date().toISOString(),
      data: permission,
    });
  } catch (error: any) {
    console.error("Error updating permission:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Permission not found",
        });
      }
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Permission already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ########### Delete permission by ID | DELETE: /api/v1/permissions/:id # //
// ##################################################################### //
export const deletePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.permission.delete({ where: { id: parseInt(id, 10) } });
    return res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting permission:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Permission not found",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// # Bulk delete permissions | DELETE: /api/v1/permissions/bulk-delete # //
// ##################################################################### //
export const bulkDeletePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { ids } = req.body; // Expecting an array of IDs in the request body
  try {
    await prisma.permission.deleteMany({
      where: {
        id: {
          in: ids.map((id: string) => parseInt(id, 10)),
        },
      },
    });
    return res.status(200).json({
      success: true,
      message: "Permissions deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting permissions:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "One or more permissions not found",
        });
      }
    }
    next(error);
  }
};
