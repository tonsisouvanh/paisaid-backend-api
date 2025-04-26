import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getMenus = async (req: Request, res: Response): Promise<any> => {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        children: true,
        roleMenus: { include: { role: { select: { id: true, name: true } } } },
      },
      orderBy: { order: "asc" },
    });
    const formattedMenus = menus.map((menu) => ({
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    }));
    res.status(200).json({ success: true, data: formattedMenus });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ success: false, message: "Failed to fetch menus" });
  }
};

export const getMenu = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const menu = await prisma.menu.findUnique({
      where: { id: Number(id) },
      include: {
        children: true,
        roleMenus: { include: { role: { select: { id: true, name: true } } } },
      },
    });
    if (!menu)
      return res
        .status(404)
        .json({ success: false, message: "Menu not found" });
    const formattedMenu = {
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    };
    res.status(200).json({ success: true, data: formattedMenu });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ success: false, message: "Failed to fetch menu" });
  }
};

export const createMenu = async (req: Request, res: Response): Promise<any> => {
  const { name, slug, path, icon, parentId, isActive, order, roles } = req.body;
  try {
    const menu = await prisma.menu.create({
      data: {
        name,
        slug,
        path: path || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        roleMenus: roles
          ? { create: roles.map((roleId: number) => ({ roleId })) }
          : undefined,
      },
      include: {
        roleMenus: { include: { role: { select: { id: true, name: true } } } },
      },
    });
    const formattedMenu = {
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    };
    res.status(201).json({ success: true, data: formattedMenu });
  } catch (error) {
    console.error("Error creating menu:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res
        .status(409)
        .json({ success: false, message: "Name or slug already exists" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to create menu" });
    }
  }
};

export const updateMenu = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, slug, path, icon, parentId, isActive, roles } = req.body;
  try {
    await prisma.roleMenu.deleteMany({ where: { menuId: Number(id) } });
    const menu = await prisma.menu.update({
      where: { id: Number(id) },
      data: {
        name,
        slug,
        path: path || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
        roleMenus: roles
          ? { create: roles.map((roleId: number) => ({ roleId })) }
          : undefined,
      },
      include: {
        roleMenus: { include: { role: { select: { id: true, name: true } } } },
      },
    });
    const formattedMenu = {
      ...menu,
      roles: menu.roleMenus.map((rm) => rm.role),
    };
    res.status(200).json({ success: true, data: formattedMenu });
  } catch (error) {
    console.error("Error updating menu:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res
        .status(409)
        .json({ success: false, message: "Name or slug already exists" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to update menu" });
    }
  }
};

export const deleteMenu = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.menu.delete({ where: { id: Number(id) } });
    res
      .status(200)
      .json({ success: true, message: "Menu deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ success: false, message: "Menu not found" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to delete menu" });
    }
  }
};

export const reorderMenus = async (req: Request, res: Response) => {
  const { menus }: { menus: { id: number; order: number }[] } = req.body;
  try {
    await prisma.$transaction(
      menus.map((menu) =>
        prisma.menu.update({
          where: { id: menu.id },
          data: { order: menu.order },
        })
      )
    );
    res
      .status(200)
      .json({ success: true, message: "Menu order updated successfully" });
  } catch (error) {
    console.error("Error reordering menus:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reorder menus" });
  }
};
