import jwt from "jsonwebtoken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (payload: {
  userId: number;
  roleId: number;
  role: string;
}) => {
  const accessToken = jwt.sign(
    { userId: payload.userId, roleId: payload.roleId, role: payload.role },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: process.env.NODE_ENV === "production" ? "15m" : "3m" } // 15 minutes
  );

  const refreshToken = jwt.sign(
    { userId: payload.userId, roleId: payload.roleId, role: payload.role },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.NODE_ENV === "production" ? "7d" : "1h" } // 7 days
  );

  return { accessToken, refreshToken };
};
