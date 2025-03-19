import { Gender, PrismaClient, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  categoriesData,
  districtData,
  menuSeedData,
  permissionData,
  provinceData,
  resourceData,
  roleData,
  rolePermissionData,
  tagsData,
  userData,
} from "./data/seedMockData";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("12341234", 10);

  // Delete all records in the correct order to handle foreign key constraints
  await prisma.resource.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.roleMenu.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();

  // Reset auto-increment values
  await prisma.$queryRaw`ALTER TABLE categories AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE tags AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE role_permissions AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE permissions AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE users AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE roles AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE resources AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE menus AUTO_INCREMENT = 1`;
  await prisma.$queryRaw`ALTER TABLE role_menus AUTO_INCREMENT = 1`;

  for (const category of categoriesData) {
    await prisma.category.create({
      data: category,
    });
  }

  // Insert seed data into the database
  for (const tag of tagsData) {
    await prisma.tag.create({
      data: tag,
    });
  }

  //seed resouces
  await prisma.resource.createMany({
    data: resourceData,
  });

  // Seed provinces
  await prisma.province.createMany({
    data: provinceData,
  });

  // Seed district
  await prisma.district.createMany({
    data: districtData,
  });

  // Seed roles
  await prisma.role.createMany({
    data: roleData,
  });

  // Seed users
  for (const user of userData) {
    await prisma.user.create({
      data: {
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: hashedPassword,
        address: user.address,
        dob: user.dob,
        gender: user.gender.toUpperCase() as Gender,
        status: user.status.toUpperCase() as UserStatus,
        roleId: user.roleId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  // Seed permissions
  await prisma.permission.createMany({
    data: permissionData,
  });

  // Seed role permissions
  await prisma.rolePermission.createMany({
    data: rolePermissionData,
  });

  //seed menu
  await prisma.menu.createMany({
    data: menuSeedData,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
