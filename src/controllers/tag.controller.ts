import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime } from "../lib/utils";

interface TagQueryParams {
  page?: number;
  limit?: number;
  q?: string; // Search term
}

const tagFilter = (queryParams: TagQueryParams): Prisma.TagWhereInput => {
  const where: Prisma.TagWhereInput = {};

  if (queryParams.q) {
    where.name = { contains: queryParams.q };
  }

  return where;
};

// GET /api/v1/tags
export const getTags = async (req: Request, res: Response): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: TagQueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "0", 10),
    q: searchParams.get("q") || "",
  };
  const where = tagFilter(queryParams);

  try {
    const totalElements = await prisma.tag.count({ where });
    const totalPages = Math.ceil(totalElements / (queryParams.limit || 10));
    const adjustedPage = Math.max(
      1,
      Math.min(queryParams.page || 1, totalPages)
    );

    const tags = await prisma.tag.findMany({
      where,
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
      },
      data: tags,
    });
  } catch (error: any) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tags",
      error: error.message,
    });
  }
};

// GET /api/v1/tags/:id
export const getTag = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const includePosts = req.query.includePosts === "true";

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(id) },
      include: {
        categories: { select: { id: true, name: true } },
        posts: includePosts
          ? {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: { id: true, title: true, slug: true },
            }
          : undefined,
      },
    });

    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });

    return res.status(200).json({ success: true, data: tag });
  } catch (error: any) {
    console.error("Error fetching tag:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch tag" });
  }
};

// ##################################################################### //
// ################### Create tag | POST /api/v1/tags ################## //
// ##################################################################### //
export const createTag = async (req: Request, res: Response): Promise<any> => {
  const { name } = req.body;

  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });

  try {
    const tag = await prisma.tag.create({
      data: {
        name,
        createdAt: getLocalDateTime(),
      },
    });

    return res
      .status(201)
      .json({ success: true, message: "Tag created", data: tag });
  } catch (error: any) {
    console.error("Error creating tag:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Tag name already exists" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create tag" });
  }
};

// PUT /api/v1/tags/:id
export const updateTag = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });

  try {
    const tag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: {
        name,
        updatedAt: getLocalDateTime(),
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Tag updated", data: tag });
  } catch (error: any) {
    console.error("Error updating tag:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        return res
          .status(409)
          .json({ success: false, message: "Tag name already exists" });
      if (error.code === "P2025")
        return res
          .status(404)
          .json({ success: false, message: "Tag not found" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update tag" });
  }
};

// DELETE /api/v1/tags/:id
export const deleteTag = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(id) },
      include: { posts: true, categories: true },
    });

    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });
    if (tag.posts.length > 0 || tag.categories.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete tag with associated posts or categories",
      });
    }

    await prisma.tag.delete({ where: { id: parseInt(id) } });

    return res.status(200).json({ success: true, message: "Tag deleted" });
  } catch (error: any) {
    console.error("Error deleting tag:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete tag" });
  }
};
