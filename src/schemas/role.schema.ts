import { z } from "zod";

export const RoleSchema = z.object({
  name: z.string().max(255),
  description: z.string().nullable(),
  isActive: z.boolean(),
  slug: z.string(),
});
