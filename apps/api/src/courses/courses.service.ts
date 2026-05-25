import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CourseStatus } from "@prisma/client";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.course.findMany({
      where: { organizationId },
      include: {
        modules: {
          include: { lessons: { select: { id: true } } },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ isRequired: "desc" }, { order: "asc" }],
    });
  }

  async findOne(id: string) {
    return this.prisma.course.findUniqueOrThrow({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              include: { quiz: true, liveClass: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  }

  async create(data: {
    title: string;
    description?: string;
    isRequired?: boolean;
    organizationId: string;
  }) {
    return this.prisma.course.create({ data });
  }

  async publish(id: string) {
    return this.prisma.course.update({
      where: { id },
      data: { status: CourseStatus.PUBLISHED },
    });
  }

  async enroll(courseId: string, userId: string) {
    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });
  }

  async getUserProgress(courseId: string, userId: string) {
    const [enrollment, lessons, progress] = await Promise.all([
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
      this.prisma.lesson.findMany({
        where: { module: { courseId } },
        select: { id: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId, lesson: { module: { courseId } }, completed: true },
        select: { lessonId: true },
      }),
    ]);

    const total = lessons.length;
    const completed = progress.length;

    return {
      enrollment,
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
