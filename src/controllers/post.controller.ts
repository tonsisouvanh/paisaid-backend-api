import { PostStatus, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import multer from "multer";
import prisma from "../lib/prisma";
import {
  convertStringToArrayOfNumbers,
  getLocalDateTime,
  slugify,
} from "../lib/utils";
import { uploadImageToCloudinary } from "../services/upload-cloudinary.serverice";

interface PostQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  tagIds?: number[];
  city?: string;
  country?: string;
  priceRange?: string;
  sort?: "avgRating" | "createdAt" | "viewCount";
}

interface TrendingQueryParams {
  page?: number;
  limit?: number;
  timeRange?: "7d" | "30d" | "all"; // Time range for trending
}

const postFilter = (
  queryParams: PostQueryParams,
  isCms?: boolean
): Prisma.PostWhereInput => {
  const where: Prisma.PostWhereInput = {};

  if (!isCms) {
    where.AND = [
      { status: PostStatus.PUBLISHED },
      // TODO: add published At
      // {
      //   publishedAt: {
      //     not: null,
      //   },
      // },
    ];
  }

  if (queryParams.categoryId) where.categoryId = queryParams.categoryId;
  if (queryParams.tagIds)
    where.tags = { some: { id: { in: queryParams.tagIds } } };
  if (queryParams.city) where.city = { contains: queryParams.city };
  if (queryParams.country) where.country = { contains: queryParams.country };
  if (queryParams.priceRange) where.priceRange = queryParams.priceRange as any;

  return where;
};

// ##################################################################### //
// ######################### Get posts | GET api/v1/posts ######################## //
// ##################################################################### //
export const getPosts = async (req: Request, res: Response): Promise<any> => {
  const queryParams: PostQueryParams = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    categoryId: req.query.categoryId
      ? parseInt(req.query.categoryId as string)
      : undefined,
    tagIds: req.query.tagIds
      ? (req.query.tagIds as string).split(",").map(Number)
      : undefined,
    city: req.query.city as string,
    country: req.query.country as string,
    priceRange: req.query.priceRange as string,
    sort: req.query.sort as any,
  };

  const isCms = !!req.user?.role;

  const where = postFilter(queryParams, isCms);

  try {
    const totalElements = await prisma.post.count({ where });
    const totalPages = Math.ceil(totalElements / (queryParams.limit || 10));
    const adjustedPage = Math.max(
      1,
      Math.min(queryParams.page || 1, totalPages)
    );

    const posts = await prisma.post.findMany({
      where,
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
      orderBy: queryParams.sort
        ? { [queryParams.sort]: "desc" }
        : { createdAt: "desc" },
      include: {
        category: true,
        tags: true,
        // photos: { where: { isFeatured: true }, take: 1 },
        photos: { take: 1 },
        author: { select: { name: true, email: true } },
        posts: true,
      },
    });
    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
      },
      data: posts,
    });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
};

// ##################################################################### //
// ###################### Get Post Detail by id | Public | GET /api/v1/posts/:id/post-detail ###################### //
// ##################################################################### //
export const getPost = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const isCms = !!req.user?.role;
    // Increment viewCount in a transaction
    const post = await prisma.$transaction(async (tx) => {
      if (!isCms) {
        await tx.post.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
      }
      return tx.post.findUnique({
        where: { id },
        include: {
          category: true,
          tags: true,
          photos: true,
          reviews: { take: 5, orderBy: { createdAt: "desc" } },
          questions: { take: 5, include: { answers: { take: 2 } } },
        },
      });
    });

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    return res.status(200).json({ success: true, data: post });
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch post" });
  }
};

// ##################################################################### //
// ######################### Create Post | POST /api/v1/posts/create ######################## //
// ##################################################################### //
export const createPost = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      title,
      content,
      categoryId,
      tagIds,
      priceRange,
      address,
      city,
      country,
      latitude,
      longitude,
      phone,
      website,
      status,
      openingHours,
    } = req.body;
    // Type guard for req.files
    if (!req.files || !Array.isArray(req.files)) {
      return res
        .status(400)
        .json({ success: false, message: "No images uploaded" });
    }
    const files = req.files as Express.Multer.File[];

    // Convert tagIds string to array of numbers
    let tagIdsArray: number[] = convertStringToArrayOfNumbers(tagIds);

    // Basic validation
    if (tagIdsArray.some((id) => isNaN(id))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tag IDs" });
    }

    const postData = {
      title,
      content,
      categoryId: Number(categoryId),
      tagIds: tagIdsArray,
      priceRange,
      address,
      city,
      country,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      phone,
      website,
      openingHours,
      status,
      authorId: req.user!.userId, // Non-null assertion since auth middleware guarantees user
    };

    // Create the post
    const post = await prisma.post.create({
      data: {
        title: postData.title,
        slug: slugify(postData.title),
        content: postData.content,
        categoryId: postData.categoryId,
        tags: tagIdsArray.length
          ? { connect: tagIdsArray.map((id) => ({ id })) }
          : undefined,
        priceRange: postData.priceRange,
        address: postData.address,
        city: postData.city,
        status: postData.status,
        country: postData.country,
        publishedAt:
          status?.toUpperCase() === PostStatus.PUBLISHED
            ? getLocalDateTime()
            : null,
        latitude: postData.latitude,
        longitude: postData.longitude,
        phone: postData.phone,
        website: postData.website,
        openingHours: postData.openingHours,
        authorId: postData.authorId,
        createdAt: getLocalDateTime(),
      },
    });

    // Upload images
    const imagePromises = files.map(async (file, index) => {
      const result = await uploadImageToCloudinary(file.buffer, {
        folder: `paisaid/posts`,
        publicId: `image_${post.id}_${index}`, // Unique per image to avoid overwriting
        transformations: { width: 800, height: 600, crop: "fit" },
        overwrite: true,
      });
      return { url: result.secure_url, publicId: result.public_id };
    });

    const uploadedImages = await Promise.all(imagePromises);
    // Associate images with the post
    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: {
        photos: {
          create: uploadedImages.map((img) => ({
            url: img.url,
            publicId: img.publicId,
          })),
        },
      },
    });

    return res
      .status(201)
      .json({ success: true, message: "Post created", data: updatedPost });
  } catch (error: any) {
    console.error("Error creating post:", error);
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Slug already exists" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create post" });
  }
};

// ##################################################################### //
// ################### Update Post | PUT /api/v1/posts/:id ################## //
// ##################################################################### //
export const updatePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // Post ID from URL
    const {
      title,
      content,
      categoryId,
      tagIds,
      priceRange,
      address,
      city,
      status,
      country,
      latitude,
      longitude,
      phone,
      website,
      openingHours,
    } = req.body;

    // Type guard for req.files (for image uploads)
    const files =
      req.files && Array.isArray(req.files)
        ? (req.files as Express.Multer.File[])
        : [];

    // Convert tagIds string to array of numbers
    let tagIdsArray: number[] = convertStringToArrayOfNumbers(tagIds);

    // Basic validation
    if (tagIdsArray.some((id) => isNaN(id))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tag IDs" });
    }

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { photos: true }, // Include existing photos to manage updates
    });

    if (!existingPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Prepare post data for update
    const postData = {
      title: title || existingPost.title,
      content: content || existingPost.content,
      categoryId: categoryId ? Number(categoryId) : existingPost.categoryId,
      priceRange:
        priceRange !== undefined ? priceRange : existingPost.priceRange,
      address: address !== undefined ? address : existingPost.address,
      city: city !== undefined ? city : existingPost.city,
      country: country !== undefined ? country : existingPost.country,
      latitude: latitude ? Number(latitude) : existingPost.latitude,
      longitude: longitude ? Number(longitude) : existingPost.longitude,
      phone: phone !== undefined ? phone : existingPost.phone,
      website: website !== undefined ? website : existingPost.website,
      openingHours:
        openingHours !== undefined ? openingHours : existingPost.openingHours,
      status,
      updatedAt: getLocalDateTime(),
    };

    // Update the post
    const post = await prisma.post.update({
      where: { id },
      data: {
        title: postData.title,
        slug: slugify(postData.title), // Update slug if title changes
        content: postData.content,
        categoryId: postData.categoryId,
        tags: tagIdsArray.length
          ? { set: tagIdsArray.map((id) => ({ id })) } // Replace existing tags with new ones
          : undefined,
        priceRange: postData.priceRange,
        address: postData.address,
        city: postData.city,
        country: postData.country,
        publishedAt:
          status?.toUpperCase() === PostStatus.PUBLISHED
            ? getLocalDateTime()
            : null,
        latitude: postData.latitude,
        longitude: postData.longitude,
        phone: postData.phone,
        website: postData.website,
        openingHours: postData.openingHours,
        updatedAt: postData.updatedAt,
        status,
      },
    });

    // Handle image updates (append new images, keep existing ones unless explicitly cleared)
    if (files.length > 0) {
      const imagePromises = files.map(async (file, index) => {
        const result = await uploadImageToCloudinary(file.buffer, {
          folder: `paisaid/posts`,
          publicId: `image_${post.id}_${index + existingPost.photos.length}`, // Append to existing images
          transformations: { width: 800, height: 600, crop: "fit" },
          overwrite: true,
        });
        return { url: result.secure_url, publicId: result.public_id };
      });

      const uploadedImages = await Promise.all(imagePromises);

      // Update post with new images (append to existing)
      const updatedPost = await prisma.post.update({
        where: { id: post.id },
        data: {
          photos: {
            create: uploadedImages.map((img) => ({
              url: img.url,
              publicId: img.publicId,
            })),
          },
        },
      });

      return res
        .status(200)
        .json({ success: true, message: "Post updated", data: updatedPost });
    }

    // If no new images, return the updated post without modifying photos
    return res
      .status(200)
      .json({ success: true, message: "Post updated", data: post });
  } catch (error: any) {
    console.error("Error updating post:", error);
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ success: false, message: "Slug already exists" });
      }
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update post" });
  }
};

// DELETE /api/v1/posts/:id
//TODO: Hanlde delete image from cloundinary if post contains images
export const deletePost = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.post.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete post" });
  }
};

// GET /api/v1/posts/:slug/nearby
export const getNearbyPosts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { slug } = req.params;
  const { distance = 10 } = req.query; // Distance in kilometers
  try {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post || !post.latitude || !post.longitude) {
      return res
        .status(404)
        .json({ success: false, message: "Post or location data not found" });
    }

    // Simple Haversine-like approximation (for MySQL, use ST_Distance_Sphere if available)
    const nearbyPosts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: post.id },
        latitude: {
          gte: post.latitude - 0.1 * Number(distance),
          lte: post.latitude + 0.1 * Number(distance),
        },
        longitude: {
          gte: post.longitude - 0.1 * Number(distance),
          lte: post.longitude + 0.1 * Number(distance),
        },
      },
      take: 10,
      orderBy: { viewCount: "desc" },
      include: {
        category: true,
        photos: { where: { isFeatured: true }, take: 1 },
      },
    });

    return res.status(200).json({ success: true, data: nearbyPosts });
  } catch (error: any) {
    console.error("Error fetching nearby posts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch nearby posts" });
  }
};

// PATCH /api/v1/posts/:id/increment-view
export const incrementViewCount = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  try {
    const post = await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return res
      .status(200)
      .json({ success: true, message: "View count incremented", data: post });
  } catch (error: any) {
    console.error("Error incrementing view count:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to increment view count" });
  }
};

// GET /api/v1/posts/trending
export const getTrendingPosts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const queryParams: TrendingQueryParams = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    timeRange: (req.query.timeRange as any) || "30d",
  };
  const days =
    queryParams.timeRange === "7d"
      ? 7
      : queryParams.timeRange === "30d"
      ? 30
      : undefined;
  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    ...(days && {
      createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    }),
  };

  try {
    const totalElements = await prisma.post.count({ where });
    const totalPages = Math.ceil(totalElements / (queryParams.limit || 10));
    const adjustedPage = Math.max(
      1,
      Math.min(queryParams.page || 1, totalPages)
    );

    const posts = await prisma.post.findMany({
      where,
      skip: (adjustedPage - 1) * (queryParams.limit || 10),
      take: queryParams.limit,
      orderBy: [
        { viewCount: "desc" },
        { avgRating: "desc" },
        { reviewCount: "desc" },
      ],
      include: {
        category: true,
        photos: { where: { isFeatured: true }, take: 1 },
      },
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
      },
      data: posts,
    });
  } catch (error: any) {
    console.error("Error fetching trending posts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch trending posts" });
  }
};

// PATCH /api/v1/posts/:id/publish
export const publishPost = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  try {
    const post = await prisma.post.update({
      where: { id },
      data: { status: "PUBLISHED", updatedAt: getLocalDateTime() },
    });
    return res
      .status(200)
      .json({ success: true, message: "Post published", data: post });
  } catch (error: any) {
    console.error("Error publishing post:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to publish post" });
  }
};

// PATCH /api/v1/posts/:id/archive
export const archivePost = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  try {
    const post = await prisma.post.update({
      where: { id },
      data: { status: "ARCHIVED", updatedAt: getLocalDateTime() },
    });
    return res
      .status(200)
      .json({ success: true, message: "Post archived", data: post });
  } catch (error: any) {
    console.error("Error archiving post:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to archive post" });
  }
};

// POST /api/v1/posts/bulk-create
export const bulkCreatePosts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const posts = req.body; // Array of post objects
  try {
    const createdPosts = await prisma.post.createMany({
      data: posts.map((post: any) => ({
        ...post,
        slug: slugify(post.title),
        authorId: req.user.id,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
      })),
    });
    return res
      .status(201)
      .json({ success: true, message: "Posts created", data: createdPosts });
  } catch (error: any) {
    console.error("Error bulk creating posts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to bulk create posts" });
  }
};

// DELETE /api/v1/posts/bulk-delete
export const bulkDeletePosts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { ids } = req.body;
  // Line 7-15: Added input validation
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "IDs must be a non-empty array" });
  }

  try {
    // Line 27-37: Wrapped in transaction and added deletion count
    const result = await prisma.$transaction(async (tx) => {
      // Optional: Delete related photos first (if schema doesn’t cascade)
      // await tx.photo.deleteMany({
      //   where: { postId: { in: parsedIds } },
      // });

      const deleteResult = await tx.post.deleteMany({
        where: {
          id: { in: ids },
          // Optional: Restrict to user's posts (if not admin-only)
          // authorId: req.user.userId,
        },
      });

      return deleteResult;
    });

    // Line 40-42: Enhanced response with count
    if (result.count === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No posts found to delete" });
    }

    return res.status(200).json({
      success: true,
      message: "Posts deleted successfully",
      data: { deletedCount: result.count },
    });
  } catch (error: any) {
    // Line 50-57: Improved error handling
    console.error("Error bulk deleting posts:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "One or more posts not found" });
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to bulk delete posts",
      error: error.message,
    });
  }
};
