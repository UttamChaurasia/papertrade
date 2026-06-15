import { Controller, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Body, Post, Request, Headers } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  refresh(@Request() req) {
    return this.authService.refreshTokens(
        req.user.sub, req.user.refreshToken
    );
  }
  
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Request() req, @Headers('authorization') auth: string) {
    const token = auth?.split(' ')[1];
    return this.authService.logout(req.user.sub, token);
  }
}