import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getLocalDateTime, handlePrismaError } from "../lib/utils";

interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

const queryFilter = (queryParams: QueryParams): Prisma.DistrictWhereInput => {
  const where: Prisma.DistrictWhereInput = { deletedAt: null };

  if (queryParams.q) {
    where.OR = [{ districtName: { contains: queryParams.q } }];
  }

  return where;
};

const getPageUrl = (pageNum: number, queryParams: QueryParams) => {
  const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/districts?page=${pageNum}&limit=${queryParams.limit}`;
  const searchParam = queryParams.q
    ? `&q=${encodeURIComponent(queryParams.q)}`
    : "";
  return `${baseUrl}${searchParam}`;
};

// ##################################################################### //
// ############## Get district list | GET: /api/v1/districts/list ############## //
// ##################################################################### //
export const getDistricts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const searchParams = new URLSearchParams(req.query as any);
  const queryParams: QueryParams = {
    page: parseInt(searchParams.get("page") || "0", 10),
    limit: parseInt(searchParams.get("limit") || "0", 10),
    q: searchParams.get("q") || "",
  };
  const where = queryFilter(queryParams);
  try {
    const totalElements = await prisma.district.count({ where });
    const totalPages = queryParams.limit
      ? Math.ceil(totalElements / queryParams.limit)
      : 1;
    const adjustedPage = queryParams.page
      ? Math.max(1, Math.min(queryParams.page, totalPages))
      : 1;

    const districts = await prisma.district.findMany({
      where,
      skip:
        queryParams.page && queryParams.limit
          ? (adjustedPage - 1) * queryParams.limit
          : undefined,
      take: queryParams.limit || undefined,
      include: {
        province: {
          select: {
            id: true,
            provinceCode: true,
            provinceName: true,
            nameEng: true,
          },
        },
      },
    });

    return res.status(200).json({
      meta: {
        totalElements,
        currentPage: queryParams.page ? adjustedPage : null,
        limit: queryParams.limit || null,
        totalPages: queryParams.limit ? totalPages : null,
        nextPageUrl:
          queryParams.page && adjustedPage < totalPages
            ? getPageUrl(adjustedPage + 1, queryParams)
            : null,
        prevPageUrl:
          queryParams.page && adjustedPage > 1
            ? getPageUrl(adjustedPage - 1, queryParams)
            : null,
        q: queryParams.q,
      },
      data: districts,
    });
  } catch (error: any) {
    console.error("Error fetching districts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch districts",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVER_ERROR",
        details: error.message || "An unexpected error occurred.",
      },
    });
  }
};

// ##################################################################### //
// ##### Delete district by id | DELETE: /api/v1/districts/:id/delete ##### //
// ##################################################################### //
export const deleteDistrict = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  try {
    const district = await prisma.district.update({
      where: { id: parseInt(id, 10) },
      data: {
        deletedAt: getLocalDateTime(),
      },
    });
    return res.status(200).json({
      success: true,
      message: "District deleted successfully",
      timestamp: new Date().toISOString(),
      data: district,
    });
  } catch (error: any) {
    console.error("Error deleting district:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = handlePrismaError(error);
      if (prismaError.statusCode === 404) {
        return res.status(404).json({
          status: "error",
          message: "District not found",
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to delete district",
    });
  }
};
