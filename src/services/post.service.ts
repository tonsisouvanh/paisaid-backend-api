import { PrismaClient, Post, PriceRange } from "@prisma/client";
import { uploadImageToCloudinary } from "./upload-cloudinary.serverice";
import { getLocalDateTime, slugify } from "../lib/utils";

const prisma = new PrismaClient();

interface PostData {
  title: string;
  content: string;
  categoryId: number;
  tagIds: number[];
  priceRange?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  openingHours?: string;
  authorId: number;
}

interface UploadedImage {
  url: string;
  publicId: string;
}

export const createPostWithImages = async (
  postData: PostData,
  files: Express.Multer.File[]
): Promise<{ post: Post; images: UploadedImage[] }> => {
  // Create the post
  const post = await prisma.post.create({
    data: {
      title: postData.title,
      slug: slugify(postData.title),
      content: postData.content,
      categoryId: postData.categoryId,
      tags: { connect: postData.tagIds.map((id) => ({ id })) },
      priceRange: (postData.priceRange as PriceRange) || "HIGH",
      address: postData.address,
      city: postData.city,
      country: postData.country,
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
      folder: `paisaid/posts/${post.id}`,
      publicId: `image_${post.id}_${index}`, // Unique per image to avoid overwriting
      // transformations: { width: 800, height: 600, crop: "fit" },
      overwrite: true,
    });
    return { url: result.secure_url, publicId: result.public_id };
  });

  const uploadedImages = await Promise.all(imagePromises);

  // Associate images with the post
  await prisma.post.update({
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

  return { post, images: uploadedImages };
};
