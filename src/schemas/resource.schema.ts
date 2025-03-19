import { z } from "zod";

export const resourceSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(255, { message: "Name must be 255 characters or less" }),
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .max(255, { message: "Slug must be 255 characters or less" }),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const resourceUpdateSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(255, { message: "Name must be 255 characters or less" }),
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .max(255, { message: "Slug must be 255 characters or less" }),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
