import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime } from "../lib/utils";

interface CategoryQueryParams {
  page?: number;
  limit?: number;
  parentId?: number | "null"; // "null" for top-level categories
  includeChildren?: boolean;
  q?: string;
}

const categoryFilter = (
  queryParams: CategoryQueryParams
): Prisma.CategoryWhereInput => {
  const where: Prisma.CategoryWhereInput = {};

  if (queryParams.parentId === "null") {
    where.parentId = null;
  } else if (queryParams.parentId !== undefined) {
    where.parentId = queryParams.parentId;
  }

  return where;
};

// GET /api/v1/categories
export const getCategories = async (
  req: Request,
  res: Response
): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: CategoryQueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "0", 10),
    q: searchParams.get("q") || "",
  };
  const where = categoryFilter(queryParams);

  try {
    // Count the total number of roles matching the filter
    const totalElements = await prisma.category.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      include: queryParams.includeChildren ? { children: true } : undefined,
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
      },
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// GET /api/v1/categories/:id
export const getCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const includePosts = req.query.includePosts === "true";

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        children: true,
        posts: includePosts
          ? { take: 5, orderBy: { createdAt: "desc" } }
          : undefined,
      },
    });

    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    console.error("Error fetching category:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch category" });
  }
};

// POST /api/v1/categories
export const createCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { name, parentId } = req.body;

  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });

  try {
    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parentExists)
        return res
          .status(404)
          .json({ success: false, message: "Parent category not found" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        parentId: parentId || null,
        createdAt: getLocalDateTime(),
      },
    });

    return res
      .status(201)
      .json({ success: true, message: "Category created", data: category });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Category name already exists" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create category" });
  }
};

// PUT /api/v1/categories/:id
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const { name, parentId } = req.body;

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parentExists)
        return res
          .status(404)
          .json({ success: false, message: "Parent category not found" });
      if (parentId === parseInt(id))
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent",
        });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        parentId: parentId === null ? null : parentId || undefined,
        updatedAt: getLocalDateTime(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category updated",
      data: updatedCategory,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Category name already exists" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update category" });
  }
};

// DELETE /api/v1/categories/:id
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: { posts: true, children: true },
    });

    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    if (category.posts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with associated posts",
      });
    }
    if (category.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with subcategories",
      });
    }

    await prisma.category.delete({ where: { id: parseInt(id) } });

    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete category" });
  }
};
