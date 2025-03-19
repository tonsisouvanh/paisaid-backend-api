import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../services/upload-cloudinary.serverice";
import { Prisma } from "@prisma/client";

// Define the query parameters interface
interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

// Function to construct the Prisma where filter based on query parameters
const queryFilter = (queryParams: QueryParams): Prisma.PhotoWhereInput => {
  const where: Prisma.PhotoWhereInput = {};

  if (queryParams.q) {
    where.OR = [{ postId: { contains: queryParams.q } }];
  }

  return where;
};

// GET /posts/:slug/photos - List photos for a post (paginated)
export const getPostPhotos = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { slug } = req.params;
    const searchParams = new URLSearchParams(req.query as any);
    const queryParams: QueryParams = {
      page: parseInt(searchParams.get("page") || "0", 10),
      limit: parseInt(searchParams.get("limit") || "0", 10),
      q: searchParams.get("q") || "",
    };
    const where = queryFilter(queryParams);
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Count the total number of roles matching the filter
    const totalElements = await prisma.photo.count({ where });

    // Calculate the total number of pages
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;

    // Adjust the current page to be within valid range
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    const photos = await prisma.photo.findMany({
      where: { postId: post.id },
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
      },
      data: photos,
    });
  } catch (error: any) {
    console.error("Error fetching photos:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch photos" });
  }
};

// POST /posts/:slug/photos - Upload a photo for a post (authenticated user)
export const uploadPhoto = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { slug } = req.params;
    const { altText } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check if user is authorized (e.g., post author or admin)
    if (post.authorId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only upload photos to your own posts",
      });
    }

    // Handle file upload (assuming multer is used)
    const files =
      req.files && Array.isArray(req.files)
        ? (req.files as Express.Multer.File[])
        : [];
    if (files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const file = files[0]; // Handle single file upload for simplicity; extend for multiple if needed
    const result = await uploadImageToCloudinary(file.buffer, {
      folder: `paisaid/posts`,
      publicId: `image_${post.id}_${Date.now()}`, // Unique ID to avoid overwriting
      transformations: { width: 800, height: 600, crop: "fit" },
      overwrite: true,
    });

    const photo = await prisma.photo.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id, // Store publicId for deletion
        altText: altText || `Photo for ${post.title}`,
        postId: post.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      data: photo,
    });
  } catch (error: any) {
    console.error("Error uploading photo:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload photo" });
  }
};

// PUT /photos/:id - Update a photo (e.g., set as featured, admin or uploader only)
export const updatePhoto = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { altText, isFeatured } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch the photo
    const photo = await prisma.photo.findUnique({
      where: { id: Number(id) },
      include: { post: true },
    });

    if (!photo) {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });
    }

    // Check authorization (uploader or admin)
    if (photo.post.authorId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own photos",
      });
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id: Number(id) },
      data: {
        altText: altText !== undefined ? altText : photo.altText,
        isFeatured: isFeatured !== undefined ? isFeatured : photo.isFeatured, // Assuming isFeatured exists; add to schema if not
      },
    });

    return res.status(200).json({
      success: true,
      message: "Photo updated successfully",
      data: updatedPhoto,
    });
  } catch (error: any) {
    console.error("Error updating photo:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update photo" });
  }
};

// ##################################################################### //
// ############## Delete Photo | DELETE /photos/:id/delete ############# //
// ##################################################################### //
export const deletePhoto = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params; // Photo ID from URL
    // Fetch the photo to ensure it exists and get its details
    const photo = await prisma.photo.findUnique({
      where: { id: Number(id) },
      include: { post: true }, // Include post to verify ownership if needed
    });
    if (!photo) {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });
    }

    // Delete from Cloudinary
    await deleteImageFromCloudinary(photo.publicId);

    // Delete from Prisma database
    await prisma.photo.delete({
      where: { id: Number(id) },
    });

    return res
      .status(200)
      .json({ success: true, message: "Photo deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting photo:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });
    }
    if (error.message.includes("Cloudinary")) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image from Cloudinary",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete photo" });
  }
};
