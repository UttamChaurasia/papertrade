import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RedisService } from '../cache/redis.service';
import { User } from '../users/users.schema';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private redisService: RedisService,
    ) {}

    async register(email: string, password: string) {
        const existing = await this.usersService.findByEmail(email);
        if (existing) throw new ConflictException('Email already exits');

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.usersService.create({email, passwordHash});
        return this.generateTokens(user);
    }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.generateTokens(user);
    }

    private async generateTokens(user: User) {
        const payload = { sub: user._id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload, { 
            secret: process.env.JWT_SECRET,
            expiresIn: '15m' 
        });
        const refreshToken = this.jwtService.sign(payload, { 
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d' 
        });

        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(user._id.toString(), hashedRefresh);
        return { accessToken, refreshToken };
    }

    async logout(userId: string, accessToken: string) {
        await this.redisService.blacklistToken(accessToken);
        await this.usersService.updateRefreshToken(userId, null);

    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user?.refreshToken) throw new ForbiddenException('Access denied');
        const matches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!matches) throw new ForbiddenException('Token reuse detected');
        
        return this.generateTokens(user);
    }

}