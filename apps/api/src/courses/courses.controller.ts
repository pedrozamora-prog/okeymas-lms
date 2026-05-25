import { Controller, Get, Post, Param, Body, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CoursesService } from "./courses.service";

interface JwtUser {
  id: string;
  organizationId: string;
  role: string;
}

@Controller("courses")
@UseGuards(AuthGuard("jwt"))
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  findAll(@Request() req: { user: JwtUser }) {
    return this.coursesService.findAll(req.user.organizationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(id);
  }

  @Post(":id/enroll")
  enroll(@Param("id") id: string, @Request() req: { user: JwtUser }) {
    return this.coursesService.enroll(id, req.user.id);
  }

  @Get(":id/progress")
  getProgress(@Param("id") id: string, @Request() req: { user: JwtUser }) {
    return this.coursesService.getUserProgress(id, req.user.id);
  }

  @Post()
  create(
    @Body() body: { title: string; description?: string; isRequired?: boolean },
    @Request() req: { user: JwtUser }
  ) {
    return this.coursesService.create({ ...body, organizationId: req.user.organizationId });
  }
}
