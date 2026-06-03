import { PropertyStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveLandlordDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ModerateListingDto {
  @IsEnum(PropertyStatus)
  status: PropertyStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
