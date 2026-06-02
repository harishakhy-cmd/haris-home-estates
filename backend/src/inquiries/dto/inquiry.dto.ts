import { IsString, MinLength } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  propertyId: string;

  @IsString()
  @MinLength(10)
  message: string;
}
