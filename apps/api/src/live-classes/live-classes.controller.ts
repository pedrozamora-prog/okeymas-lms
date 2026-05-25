import { Controller, Get, Post, Body, Param, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LiveClassesService } from "./live-classes.service";

interface JwtUser {
  id: string;
  organizationId: string;
  role: string;
}

@Controller("live-classes")
@UseGuards(AuthGuard("jwt"))
export class LiveClassesController {
  constructor(private liveClassesService: LiveClassesService) {}

  @Get("upcoming")
  findUpcoming(@Request() req: { user: JwtUser }) {
    return this.liveClassesService.findUpcoming(req.user.organizationId);
  }

  @Post()
  create(
    @Body() body: { title: string; scheduledAt: string; durationMins?: number },
    @Request() req: { user: JwtUser }
  ) {
    return this.liveClassesService.create({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
      instructorId: req.user.id,
      organizationId: req.user.organizationId,
    });
  }

  @Post(":id/attend")
  attend(@Param("id") id: string, @Request() req: { user: JwtUser }) {
    return this.liveClassesService.recordAttendance(id, req.user.id);
  }
}
