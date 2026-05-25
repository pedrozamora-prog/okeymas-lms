import { Injectable, ConflictException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";

interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
  organizationId: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        organization: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException("El email ya está registrado");

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        hashedPassword,
        role: dto.role ?? Role.EMPLOYEE,
        organizationId: dto.organizationId,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }
}
