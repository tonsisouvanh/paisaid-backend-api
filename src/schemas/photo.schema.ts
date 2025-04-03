import { z } from "zod";

export const PhotoReorderSchema = z
  .array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int().nonnegative(),
    })
  )
  .min(1);
