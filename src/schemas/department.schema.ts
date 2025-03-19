import z from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const editDepartmentSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});
