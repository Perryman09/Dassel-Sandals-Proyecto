import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile/:id')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.authService.getProfile(id);
  }
}
