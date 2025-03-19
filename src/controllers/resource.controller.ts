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
const queryFilter = (queryParams: QueryParams): Prisma.ResourceWhereInput => {
  const where: Prisma.ResourceWhereInput = {};

  if (queryParams.q) {
    where.OR = [
      { name: { contains: queryParams.q } },
      { slug: { contains: queryParams.q } },
    ];
  }

  return where;
};

// ##################################################################### //
// ############ Get resource list | GET: /api/v1/resources ############# //
// ##################################################################### //
export const getResources = async (
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
    // Count the total number of resources matching the filter
    const totalElements = await prisma.resource.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    // Fetch the resources from the database with pagination
    const resourceData = await prisma.resource.findMany({
      where,
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
    });

    // Return the response with meta information and resource data
    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
        q: queryParams.q,
      },
      data: resourceData,
    });
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Resource already exists",
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resources",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVER_ERROR",
        details: error.message || "An unexpected error occurred.",
      },
    });
  }
};

// ##################################################################### //
// ############ Get resource by id | GET: /api/v1/resources/:id ######## //
// ##################################################################### //
export const getResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!resource) {
      return res.status(404).json({
        status: "error",
        message: "Resource not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Resource retrieved successfully",
      timestamp: new Date().toISOString(),
      data: resource,
    });
  } catch (error: any) {
    console.error("Error fetching resource:", error);
    next(error);
  }
};

// ##################################################################### //
// ############ Create resource | POST: /api/v1/resources/create ######## //
// ##################################################################### //
export const createResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { name, slug, description, isActive } = req.body;
  try {
    const resource = await prisma.resource.create({
      data: {
        name,
        slug: slugify(slug),
        description,
        isActive: isActive ?? true,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
      },
    });
    return res.status(201).json({
      success: true,
      message: "Resource created successfully",
      timestamp: new Date().toISOString(),
      data: resource,
    });
  } catch (error: any) {
    console.error("Error creating resource:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Resource already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ############ Edit resource by ID | PUT: /api/v1/resources/:id ######## //
// ##################################################################### //
export const editResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  const { name, slug, description, isActive } = req.body;
  try {
    const resource = await prisma.resource.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        slug: slugify(slug),
        description,
        isActive,
        updatedAt: getLocalDateTime(),
      },
    });
    return res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      timestamp: new Date().toISOString(),
      data: resource,
    });
  } catch (error: any) {
    console.error("Error updating resource:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Resource not found",
        });
      }
      if (prismaError.statusCode === 409) {
        return res.status(409).json({
          status: "error",
          message: "Resource already exists",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ############ Delete resource by ID | DELETE: /api/v1/resources/:id ### //
// ##################################################################### //
export const deleteResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.resource.delete({ where: { id: parseInt(id, 10) } });
    return res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Resource not found",
        });
      }
    }
    next(error);
  }
};

// ##################################################################### //
// ######## Bulk delete resources | DELETE: /api/v1/resources/bulk-delete # //
// ##################################################################### //
export const bulkDeleteResources = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { ids } = req.body; // Expecting an array of IDs in the request body
  try {
    await prisma.resource.deleteMany({
      where: {
        id: {
          in: ids.map((id: string) => parseInt(id, 10)),
        },
      },
    });
    return res.status(200).json({
      success: true,
      message: "Resources deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting resources:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "One or more resources not found",
        });
      }
    }
    next(error);
  }
};
