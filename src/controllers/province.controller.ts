import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime, handlePrismaError } from "../lib/utils";

interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

const queryFilter = (queryParams: QueryParams): Prisma.ProvinceWhereInput => {
  const where: Prisma.ProvinceWhereInput = { deletedAt: null };

  if (queryParams.q) {
    where.OR = [{ provinceName: { contains: queryParams.q } }];
  }

  return where;
};

const getPageUrl = (pageNum: number, queryParams: QueryParams) => {
  const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/provinces?page=${pageNum}&limit=${queryParams.limit}`;
  const searchParam = queryParams.q
    ? `&q=${encodeURIComponent(queryParams.q)}`
    : "";
  return `${baseUrl}${searchParam}`;
};

// ##################################################################### //
// ############## Get province list | GET: /api/v1/provinces/list ############## //
// ##################################################################### //
export const getProvinces = async (
  req: Request,
  res: Response
): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: QueryParams = {
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    q: searchParams.get("q") || "",
  };
  const where = queryFilter(queryParams);
  try {
    const totalElements = await prisma.province.count({ where });
    const totalPages = Math.ceil(totalElements / (queryParams.limit || 10));
    const adjustedPage = Math.max(
      1,
      Math.min(queryParams.page || 1, totalPages)
    );

    const provinces = await prisma.province.findMany({
      where,
      skip: (adjustedPage - 1) * (queryParams.limit || 10),
      take: queryParams.limit,
      include: {
        districts: {
          select: {
            id: true,
            districtName: true,
            districtCode: true,
          },
        },
      },
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: adjustedPage,
        limit: queryParams.limit,
        totalPages,
        nextPageUrl:
          adjustedPage < totalPages
            ? getPageUrl(adjustedPage + 1, queryParams)
            : null,
        prevPageUrl:
          adjustedPage > 1 ? getPageUrl(adjustedPage - 1, queryParams) : null,
        q: queryParams.q,
      },
      data: provinces,
    });
  } catch (error: any) {
    console.error("Error fetching provinces:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch provinces",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVER_ERROR",
        details: error.message || "An unexpected error occurred.",
      },
    });
  }
};

// ##################################################################### //
// ##### Delete province by id | DELETE: /api/v1/provinces/:id/delete ##### //
// ##################################################################### //
export const deleteProvince = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  try {
    const province = await prisma.province.update({
      where: { id: parseInt(id, 10) },
      data: {
        deletedAt: getLocalDateTime(),
      },
    });
    return res.status(200).json({
      success: true,
      message: "Province deleted successfully",
      timestamp: new Date().toISOString(),
      data: province,
    });
  } catch (error: any) {
    console.error("Error deleting province:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "Province not found",
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to delete province",
    });
  }
};
