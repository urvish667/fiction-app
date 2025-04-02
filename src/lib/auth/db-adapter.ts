import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function getPrismaAdapter() {
  return PrismaAdapter(prisma);
}

export { prisma }; 