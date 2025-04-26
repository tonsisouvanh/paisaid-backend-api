import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../services/upload-cloudinary.serverice";
import { getLocalDateTime } from "../lib/utils";

// ##################################################################### //
// ################## Create or update a banner slide [x] ################## //
// ##################################################################### //
export const upsertBannerSlide = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id, headline, subline, altText, order } = req.body;
    const file = req.file;

    let imageData: { imageUrl: string; imagePublicId: string } = {
      imageUrl: "",
      imagePublicId: "",
    };
    if (file) {
      const result = await uploadImageToCloudinary(file.buffer, {
        folder: "paisaid/banners",
        publicId: `banner_${Date.now()}`,
        transformations: { width: 1920, height: 1080, crop: "fit" },
        overwrite: true,
      });
      imageData = {
        imageUrl: result.secure_url,
        imagePublicId: result.public_id,
      };
    }

    const data = {
      headline,
      subline,
      altText,
      imageUrl: imageData.imageUrl || "",
      imagePublicId: imageData.imagePublicId || "",
      order: order !== undefined ? Number(order) : 0,
    };

    const banner = await prisma.banner.upsert({
      where: { id: parseInt(id) || 0 },
      update: {
        order: data.order,
        headline: data.headline,
        subline: data.subline,
        altText: altText,
        updatedAt: getLocalDateTime(),
      },
      create: {
        ...data,
        createdAt: getLocalDateTime(),
        updatedAt: getLocalDateTime(),
      },
    });

    return res.status(200).json({
      success: true,
      message: id
        ? "Banner slide updated successfully"
        : "Banner slide created successfully",
      data: banner,
    });
  } catch (error: any) {
    console.error("Error upserting banner slide:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save banner slide" });
  }
};

// ##################################################################### //
// ####################### Delete a banner slide [x] ####################### //
// ##################################################################### //
export const deleteBannerSlide = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    // Ensure user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch the banner slide
    const banner = await prisma.banner.findUnique({
      where: { id: Number(id) },
    });

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner slide not found" });
    }

    // Safely parse the content Json field
    const imagePublicId = banner?.imagePublicId;

    // Delete image from Cloudinary if publicId exists
    if (imagePublicId) {
      await deleteImageFromCloudinary(imagePublicId);
    }

    // Delete the banner slide from the database
    await prisma.banner.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Banner slide deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting banner slide:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Banner slide not found" });
    }
    if (error.message.includes("Cloudinary")) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image from Cloudinary",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete banner slide",
    });
  }
};

// ##################################################################### //
// ####################### Reorder banner slides ####################### //
// ##################################################################### //
export const reorderBannerSlides = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const slides: { id: number; order: number }[] = req.body;

    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: Array of slide IDs and orders required",
      });
    }

    await prisma.$transaction(
      slides.map((slide) =>
        prisma.banner.update({
          where: { id: slide.id },
          data: { order: slide.order },
        })
      )
    );

    const updatedSlides = await prisma.banner.findMany({
      orderBy: { order: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Banner slides reordered successfully",
      data: updatedSlides,
    });
  } catch (error: any) {
    console.error("Error reordering banner slides:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reorder banner slides" });
  }
};

// ##################################################################### //
// ###################### Fetch all banner slides ###################### //
// ##################################################################### //
export const getBannerSlides = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const slides = await prisma.banner.findMany({
      orderBy: { order: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: slides,
    });
  } catch (error: any) {
    console.error("Error fetching banner slides:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch banner slides" });
  }
};

// Define the expected structure of the content Json field
interface BannerContent {
  headline: string;
  subline?: string;
  image: {
    url: string;
    imagePublicId: string;
    altText?: string;
  };
}

// ##################################################################### //
// ########################## Get banner by id ######################### //
// ##################################################################### //
export const getBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { id } = req.params;
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: Number(id) },
    });

    if (!banner)
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });

    return res.status(200).json({ success: true, data: banner });
  } catch (error: any) {
    console.error("Error fetching post:", error);
    next(error);
  }
};
