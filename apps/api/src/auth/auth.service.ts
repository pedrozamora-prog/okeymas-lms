import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.hashedPassword || !user.isActive) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) throw new UnauthorizedException("Credenciales inválidas");

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
