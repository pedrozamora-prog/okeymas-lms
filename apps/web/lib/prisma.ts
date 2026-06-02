// Copyright (c) 2025-2026 Yelau Group. All rights reserved.
// Author: Pedro Zamora (Yeye) — pedro.zamora@yelaugroup.com
// Unauthorized sale or redistribution is strictly prohibited.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
