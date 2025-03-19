import { z } from "zod";

export const editBranchSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

export const createBranchSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});
