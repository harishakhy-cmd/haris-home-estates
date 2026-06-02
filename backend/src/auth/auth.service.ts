import { ConflictException, Injectable, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const publicUser = ({ passwordHash, ...user }: { passwordHash: string; [key: string]: unknown }) => user;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const email = dto.email?.toLowerCase();
    const phone = dto.phone?.replace(/\s+/g, '');
    const whatsapp = dto.whatsapp?.replace(/\s+/g, '');
    
    if ((dto.role ?? UserRole.TENANT) === UserRole.LANDLORD) {
      if (!email || !whatsapp) {
        throw new ConflictException('Landlord registration requires both email and a WhatsApp contact number');
      }
    } else if (!email && !phone) {
      throw new ConflictException('Use either email or contact number to register');
    }
    
    const exists = await this.prisma.user.findFirst({
      where: { OR: [email ? { email } : undefined, phone ? { phone } : undefined, whatsapp ? { whatsapp } : undefined].filter(Boolean) as Prisma.UserWhereInput[] },
    });
    if (exists) throw new ConflictException('Account already exists for this email or contact number');
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone,
        whatsapp,
        role: dto.role ?? UserRole.TENANT,
        landlordApproved: (dto.role ?? UserRole.TENANT) !== UserRole.LANDLORD,
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const normalizedIdentifier = identifier.replace(/\s+/g, '');
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { phone: normalizedIdentifier }, { whatsapp: normalizedIdentifier }] },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid login details');
    }
    if (user.role === UserRole.ADMIN && user.email !== 'harishakhy@gmail.com') {
      throw new UnauthorizedException('Only the configured HARIS admin can access the admin panel');
    }
    return this.issueTokens(user);
  }

  googleAuthUrl() {
    throw new NotImplementedException('Google registration is ready for OAuth credentials. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and callback handling for production.');
  }

  private async issueTokens(user: any) {
    const payload = { sub: user.id, email: user.email, phone: user.phone, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload, { expiresIn: '15m' }),
      refreshToken: await this.jwt.signAsync(payload, { expiresIn: '7d' }),
      user: publicUser(user),
    };
  }
}
