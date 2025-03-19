import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime } from "../lib/utils";

interface ReviewQueryParams {
  page?: number;
  limit?: number;
  sort?: "rating" | "createdAt";
  isApproved?: boolean; // Admin-only filter
}

const reviewFilter = (
  queryParams: ReviewQueryParams,
  slug: string,
  isAdmin: boolean
): Prisma.ReviewWhereInput => {
  const where: Prisma.ReviewWhereInput = { post: { slug } };

  if (queryParams.isApproved !== undefined && isAdmin) {
    where.isApproved = queryParams.isApproved;
  } else {
    where.isApproved = true; // Public only sees approved reviews
  }

  return where;
};

// GET /api/v1/posts/:slug/reviews
export const getPostReviews = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { slug } = req.params;
  const queryParams: ReviewQueryParams = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    sort: req.query.sort as any,
    isApproved:
      req.query.isApproved !== undefined
        ? req.query.isApproved === "true"
        : undefined,
  };
  const isAdmin = req.user?.role?.name === "ADMIN"; // From auth middleware
  const where = reviewFilter(queryParams, slug, isAdmin);

  try {
    const totalElements = await prisma.review.count({ where });
    const totalPages = Math.ceil(totalElements / (queryParams.limit || 10));
    const adjustedPage = Math.max(
      1,
      Math.min(queryParams.page || 1, totalPages)
    );

    const reviews = await prisma.review.findMany({
      where,
      skip: (adjustedPage - 1) * (queryParams.limit || 10),
      take: queryParams.limit,
      orderBy: queryParams.sort
        ? { [queryParams.sort]: "desc" }
        : { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, profilePic: true } } },
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
      },
      data: reviews,
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// POST /api/v1/posts/:slug/reviews
export const createReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { slug } = req.params;
  const { content, rating } = req.body;

  if (!content || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Content and rating (1-5) are required",
    });
  }

  try {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          content,
          rating,
          userId: req.user.id, // From auth middleware
          postId: post.id,
          createdAt: getLocalDateTime(),
        },
      });

      // Update post's avgRating and reviewCount
      const reviews = await tx.review.findMany({
        where: { postId: post.id, isApproved: true },
      });
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
      await tx.post.update({
        where: { id: post.id },
        data: { avgRating, reviewCount: reviews.length },
      });

      return newReview;
    });

    return res
      .status(201)
      .json({ success: true, message: "Review created", data: review });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create review" });
  }
};

// GET /api/v1/reviews/:id
export const getReview = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, name: true, profilePic: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (!review.isApproved && req.user?.role?.name !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Review not accessible" });
    }

    return res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    console.error("Error fetching review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch review" });
  }
};

// PUT /api/v1/reviews/:id
export const updateReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const { content, rating } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
    });
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (review.userId !== req.user.id && req.user.role.name !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updatedReview = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.update({
        where: { id: parseInt(id) },
        data: { content, rating, updatedAt: getLocalDateTime() },
      });

      // Recalculate post's avgRating and reviewCount if approved
      if (newReview.isApproved) {
        const reviews = await tx.review.findMany({
          where: { postId: newReview.postId, isApproved: true },
        });
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
        await tx.post.update({
          where: { id: newReview.postId },
          data: { avgRating, reviewCount: reviews.length },
        });
      }

      return newReview;
    });

    return res
      .status(200)
      .json({ success: true, message: "Review updated", data: updatedReview });
  } catch (error: any) {
    console.error("Error updating review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update review" });
  }
};

// DELETE /api/v1/reviews/:id
export const deleteReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
    });
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (review.userId !== req.user.id && req.user.role.name !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: parseInt(id) } });

      // Recalculate post's avgRating and reviewCount if approved
      if (review.isApproved) {
        const reviews = await tx.review.findMany({
          where: { postId: review.postId, isApproved: true },
        });
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
        await tx.post.update({
          where: { id: review.postId },
          data: { avgRating, reviewCount: reviews.length },
        });
      }
    });

    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete review" });
  }
};

// PATCH /api/v1/reviews/:id/approve
export const approveReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;

  if (req.user.role.name !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id: parseInt(id) },
        data: { isApproved: true, updatedAt: getLocalDateTime() },
      });

      // Update post's avgRating and reviewCount
      const reviews = await tx.review.findMany({
        where: { postId: updatedReview.postId, isApproved: true },
      });
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
      await tx.post.update({
        where: { id: updatedReview.postId },
        data: { avgRating, reviewCount: reviews.length },
      });

      return updatedReview;
    });

    return res
      .status(200)
      .json({ success: true, message: "Review approved", data: review });
  } catch (error: any) {
    console.error("Error approving review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to approve review" });
  }
};

// PATCH /api/v1/reviews/:id/reject
export const rejectReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;

  if (req.user.role.name !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id: parseInt(id) },
        data: { isApproved: false, updatedAt: getLocalDateTime() },
      });

      // Recalculate post's avgRating and reviewCount
      const reviews = await tx.review.findMany({
        where: { postId: updatedReview.postId, isApproved: true },
      });
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
      await tx.post.update({
        where: { id: updatedReview.postId },
        data: { avgRating, reviewCount: reviews.length },
      });

      return updatedReview;
    });

    return res
      .status(200)
      .json({ success: true, message: "Review rejected", data: review });
  } catch (error: any) {
    console.error("Error rejecting review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reject review" });
  }
};
