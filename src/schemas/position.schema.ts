import { z } from "zod";

export const positionCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string(),
});

export const positionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  employmentType: z.enum([
    "full_time",
    "part_time",
    "contract",
    "internship",
    "temporary",
  ]),
  description: z.string().optional(),
  salaryRange: z.string().optional(),
  closingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  slug: z.string().optional(),
  requirements: z.string().optional(),
  isDisplayDescriptionImage: z.string(),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  thumbnail: z.any().optional(),
  descriptionImage: z.any().optional(),
  updatedById: z.number().int().positive().optional(),
  positionCategoryId: z.number().int().positive().optional(),
  workingLocation: z.string().optional(),
});
