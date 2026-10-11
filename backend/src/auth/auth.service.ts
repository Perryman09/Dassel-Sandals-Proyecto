import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedRolesAndAdminUser();
  }

  hashPassword(password: string): string {
    return crypto.createHash('md5').update(password).digest('hex');
  }

  async seedRolesAndAdminUser() {
    // 1. Sembrado de Roles del Sistema
    const defaultRoles = [
      { id: 1, name: 'admin', description: 'Administrador Principal & Propietario' },
      { id: 2, name: 'vendedor', description: 'Ventas de Mostrador y Facturación' },
      { id: 3, name: 'cajero', description: 'Control de Caja y Cobranza' },
    ];

    for (const r of defaultRoles) {
      await this.prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description },
        create: {
          id: r.id,
          name: r.name,
          description: r.description,
        },
      });
    }

    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'admin' },
    });

    // 2. Sembrado del Usuario Administrador Principal
    const adminUsername = 'Dassel2026';
    const plainPass = 'DasselSandals2026';
    const md5Pass = this.hashPassword(plainPass);

    const existing = await this.prisma.user.findUnique({
      where: { username: adminUsername },
    });

    if (!existing) {
      await this.prisma.user.create({
        data: {
          username: adminUsername,
          password: md5Pass,
          name: 'Dueño & Administrador Principal',
          roleId: adminRole?.id || 1,
          role: 'admin',
          avatar: '/dassel-logo.png',
          status: 'active',
          failedAttempts: 0,
        },
      });
      console.log(`[AuthService] Usuario administrador '${adminUsername}' inicializado con clave MD5 y rol admin.`);
    } else {
      await this.prisma.user.update({
        where: { username: adminUsername },
        data: {
          password: md5Pass,
          roleId: adminRole?.id || 1,
          role: 'admin',
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
      console.log(`[AuthService] Usuario administrador '${adminUsername}' verificado y sincronizado.`);
    }
  }

  async login(dto: LoginDto) {
    const hashed = this.hashPassword(dto.password);

    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { roleRel: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    // Verificar si la cuenta está bloqueada temporalmente por superar los 5 intentos
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const remainingSeconds = Math.max(
        1,
        Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000)
      );
      throw new UnauthorizedException(
        `Acceso bloqueado por superar 5 intentos fallidos. Espera ${remainingSeconds} segundo(s) para reintentar.`
      );
    }

    // Si el tiempo de bloqueo ya expiró, restablecer
    if (user.lockedUntil && new Date() >= new Date(user.lockedUntil)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }

    // Validar contraseña
    if (user.password !== hashed) {
      const currentAttempts = (user.failedAttempts || 0) + 1;

      if (currentAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 10 * 1000); // 10 segundos de bloqueo
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 5, lockedUntil: lockoutTime },
        });
        throw new UnauthorizedException(
          'Has alcanzado el límite de 5 intentos fallidos. Tu acceso ha sido bloqueado por 10 segundos.'
        );
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: currentAttempts },
        });
        const remaining = 5 - currentAttempts;
        throw new UnauthorizedException(
          `Usuario o contraseña incorrectos. Te quedan ${remaining} intento(s) de 5.`
        );
      }
    }

    // Contraseña correcta: restablecer contador de intentos fallidos
    if (user.failedAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Esta cuenta de usuario ha sido desactivada.');
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.roleRel?.name || user.role,
        roleId: user.roleId,
        avatar: user.avatar || '/dassel-logo.png',
      },
      token: `dassel_${user.id}_${Date.now()}`,
    };
  }

  async getProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        roleId: true,
        roleRel: true,
        avatar: true,
        status: true,
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}
