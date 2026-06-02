import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  propertyId: string;

  @Type(() => Date)
  @IsDate()
  viewingDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
