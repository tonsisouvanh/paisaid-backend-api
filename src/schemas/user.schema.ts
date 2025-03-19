import { z } from "zod";

export const UserSchema = z.object({
  name: z
    .string()
    .max(255, { message: "First name must be 255 characters or less" }),
  phone: z
    .string()
    .max(255, { message: "Phone number must be 255 characters or less" }),
  username: z
    .string()
    .min(1, { message: "Username required" })
    .max(255, { message: "Username must be 255 characters or less" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 digits" })
    .optional(),
  address: z.string().nullable().or(z.literal(null)),
  dob: z.string().nullable().or(z.literal(null)),
  email: z.string().nullable().optional(),
  roleId: z.number().optional().nullable().or(z.literal(null)),
  gender: z.string().optional(),
});
