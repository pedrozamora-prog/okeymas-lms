import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Request() req: { user: { organizationId: string } }) {
    return this.usersService.findAll(req.user.organizationId);
  }

  @Get("me")
  getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }
}
