import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ required: false })
  @ValidateIf((dto) => !dto.phone)
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @ValidateIf((dto) => !dto.email)
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @IsString()
  identifier: string;

  @IsString()
  password: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken: string;
}
