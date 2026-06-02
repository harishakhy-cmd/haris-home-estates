import { PropertyStatus, PropertyType } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreatePropertyDto {
  @IsString() title: string;
  @IsString() description: string;
  @Type(() => Number) @IsNumber() @Min(0) price: number;
  @IsEnum(PropertyType) propertyType: PropertyType;
  @Type(() => Number) @IsNumber() bedrooms: number;
  @Type(() => Number) @IsNumber() bathrooms: number;
  @IsString() address: string;
  @IsString() city: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsArray() nearbyFacilities?: string[];
  @IsOptional() @IsArray() amenityIds?: string[];
  @IsOptional() @IsArray() amenityNames?: string[];
  @IsOptional() @IsArray() imageUrls?: string[];
  @IsOptional() @IsArray() youtubeUrls?: string[];
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
}

export class PropertyFilterDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(PropertyType) propertyType?: PropertyType;
  @IsOptional() @IsString() landlordId?: string;
  @IsOptional() @IsString() sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'landlord';
  @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() bedrooms?: number;
  @IsOptional() @Type(() => Number) @IsNumber() bathrooms?: number;
}
