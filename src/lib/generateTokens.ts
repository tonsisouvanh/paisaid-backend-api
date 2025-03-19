import jwt from "jsonwebtoken";
// Helper: Generate Tokens
export const generateTokens = (payload: {
  userId: number;
  roleId: number;
  role: string;
}) => {
  const accessToken = jwt.sign(
    { userId: payload.userId, roleId: payload.roleId, role: payload.role },
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = jwt.sign(
    { userId: payload.userId, roleId: payload.roleId, role: payload.role },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};
