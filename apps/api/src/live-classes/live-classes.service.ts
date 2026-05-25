import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LiveClassesService {
  constructor(private prisma: PrismaService) {}

  async findUpcoming(organizationId: string) {
    return this.prisma.liveClass.findMany({
      where: {
        organizationId,
        scheduledAt: { gte: new Date() },
      },
      include: {
        instructor: { select: { name: true, image: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });
  }

  async create(data: {
    title: string;
    scheduledAt: Date;
    durationMins?: number;
    instructorId: string;
    organizationId: string;
  }) {
    return this.prisma.liveClass.create({ data });
  }

  async recordAttendance(liveClassId: string, userId: string) {
    return this.prisma.liveAttendance.upsert({
      where: { userId_liveClassId: { userId, liveClassId } },
      create: { userId, liveClassId },
      update: {},
    });
  }

  async setRecording(liveClassId: string, recordingUrl: string) {
    return this.prisma.liveClass.update({
      where: { id: liveClassId },
      data: { recordingUrl },
    });
  }
}
