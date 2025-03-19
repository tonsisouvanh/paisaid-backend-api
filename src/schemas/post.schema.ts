import { z } from "zod";

export const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string(),
  tagIds: z
    .string({ message: "Tag is required" })
    .min(1, { message: "Tag cannot be empty" }),
  // categoryId: z
  //   .number()
  //   .int()
  //   .positive("Category ID must be a positive integer"),
  // tagIds: z.array(z.number().int().optional().nullable()),
  priceRange: z.enum(["LOW", "MEDIUM", "HIGH", "LUXURY"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  // latitude: z.number().optional().nullable(),
  // longitude: z.number().optional().nullable(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  openingHours: z.string().optional(),
});
