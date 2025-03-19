import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime, handlePrismaError } from "../lib/utils";

// Define the query parameters interface for menu list
interface MenuQueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

// Define the menu input interface for create/update
interface MenuInput {
  name: string;
  slug: string;
  path?: string;
  icon?: string;
  parentId?: number | null;
  isActive?: boolean;
  order?: number;
  roles?: number[]; // Array of role IDs for assignment
}

// Function to construct the Prisma where filter based on query parameters
const queryFilter = (queryParams: MenuQueryParams): Prisma.MenuWhereInput => {
  const where: Prisma.MenuWhereInput = {};

  if (queryParams.q) {
    where.OR = [
      { name: { contains: queryParams.q } },
      { slug: { contains: queryParams.q } },
    ];
  }

  return where;
};

// ##################################################################### //
// ############## Get menu list | GET: /api/v1/menus/list ############## //
// ##################### Private | Role: Admin ####################### //
export const getMenus = async (req: Request, res: Response): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: MenuQueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    q: searchParams.get("q") || "",
  };
  const where = queryFilter(queryParams);

  try {
    // Count the total number of menus matching the filter
    const totalElements = await prisma.menu.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    // Fetch the menus from the database with pagination
    const menuData = await prisma.menu.findMany({
      where,
      // include: {
      //   roleMenus: {
      //     include: {
      //       role: { select: { id: true, name: true } },
      //     },
      //   },
      //   children: true, // Include child menus for hierarchical structure
      // },
      include: {
        roleMenus: { include: { role: { select: { id: true, name: true } } } },
        children: true,
      },
      orderBy: { order: "asc" }, // Sort by order field
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
    });

    // Format the response to include roles
    const formattedMenus = menuData.map((menu) => ({
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    }));

    // Return the response with meta information and menu data
    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
        q: queryParams.q,
      },
      data: formattedMenus,
    });
  } catch (error: any) {
    console.error("Error fetching menus:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Menu slug already exists",
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVER_ERROR",
        details: error.message || "An unexpected error occurred.",
      },
    });
  }
};

// ##################################################################### //
// ############## Get menu by id | GET: /api/v1/menus/:id ############## //
// ##################### Private | Role: Admin ####################### //
export const getMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    const menu = await prisma.menu.findUnique({
      where: { id: Number(id) },
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
        children: true,
      },
    });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    const formattedMenu = {
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    };

    return res.status(200).json({
      success: true,
      message: "Menu retrieved successfully",
      timestamp: new Date().toISOString(),
      data: formattedMenu,
    });
  } catch (error: any) {
    console.error("Error fetching menu:", error);
    next(error);
  }
};

// ##################################################################### //
// ############## Create menu | POST: /api/v1/menus/create ############# //
// ##################### Private | Role: Admin ####################### //
export const createMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const {
    name,
    slug,
    path,
    icon,
    parentId,
    isActive,
    order,
    roles,
  }: MenuInput = req.body;

  try {
    const menu = await prisma.menu.create({
      data: {
        name,
        slug,
        path: path || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
        roleMenus: roles
          ? {
              create: roles.map((roleId) => ({
                roleId,
                createdAt: getLocalDateTime(),
                updatedAt: getLocalDateTime(),
              })),
            }
          : undefined,
      },
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
    });

    const formattedMenu = {
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    };

    return res.status(201).json({
      success: true,
      message: "Menu created successfully",
      timestamp: new Date().toISOString(),
      data: formattedMenu,
    });
  } catch (error: any) {
    console.error("Error creating menu:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Menu name or slug already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ############## Update menu | PUT: /api/v1/menus/:id ################# //
// ##################### Private | Role: Admin ####################### //
export const updateMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  const {
    name,
    slug,
    path,
    icon,
    parentId,
    isActive,
    order,
    roles,
  }: MenuInput = req.body;

  try {
    // First, delete existing roleMenus to replace with new assignments
    await prisma.roleMenu.deleteMany({
      where: { menuId: Number(id) },
    });

    const menu = await prisma.menu.update({
      where: { id: Number(id) },
      data: {
        name,
        slug,
        path: path || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        updatedAt: getLocalDateTime(),
        roleMenus: roles
          ? {
              create: roles.map((roleId) => ({
                roleId,
                createdAt: getLocalDateTime(),
                updatedAt: getLocalDateTime(),
              })),
            }
          : undefined,
      },
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
    });

    const formattedMenu = {
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    };

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      timestamp: new Date().toISOString(),
      data: formattedMenu,
    });
  } catch (error: any) {
    console.error("Error updating menu:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Menu name or slug already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ############## Delete menu | DELETE: /api/v1/menus/:id ############## //
// ##################### Private | Role: Admin ####################### //
export const deleteMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;

  try {
    await prisma.menu.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting menu:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({
          status: "error",
          message: "Menu not found",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ########### Reorder menus | PUT: /api/v1/menus/reorder ############## //
// ##################### Private | Role: Admin ####################### //
export const reorderMenus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { menus }: { menus: { id: number; order: number }[] } = req.body;
  try {
    await prisma.$transaction(
      menus.map((menu) =>
        prisma.menu.update({
          where: { id: menu.id },
          data: {
            order: menu.order,
            updatedAt: getLocalDateTime(),
          },
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: "Menu order updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error reordering menus:", error);
    next(error);
  }
};
