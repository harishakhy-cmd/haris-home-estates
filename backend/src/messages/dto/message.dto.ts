import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  recipientId: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsString()
  @MinLength(1)
  content: string;
}
