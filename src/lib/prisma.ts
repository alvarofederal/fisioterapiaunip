import { PrismaClient } from "@/generated/prisma"

const globalForPrisma = global as typeof globalThis & { prisma: PrismaClient }

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
export { prisma as db }
