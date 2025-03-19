import { z } from "zod";

export const PermissionSchema = z.object({
  name: z.string(),
  action: z.string(),
  description: z.string().optional(),
  resourceId: z.number().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
