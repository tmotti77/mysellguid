import {
  IsArray,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class QuietHoursDto {
  @ApiProperty({ description: 'Quiet hours start time (HH:mm)', example: '22:00' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'Quiet hours end time (HH:mm)', example: '08:00' })
  @IsString()
  end: string;
}

export class UserPreferencesDto {
  @ApiProperty({ description: 'Preferred sale categories', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({ description: 'Preferred brands', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brands?: string[];

  @ApiProperty({ description: 'Minimum discount percentage (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minDiscount?: number;

  @ApiProperty({ description: 'Maximum distance in meters', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @ApiProperty({ description: 'Enable push notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;

  @ApiProperty({ description: 'Quiet hours (no notifications)', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;

  @ApiProperty({ description: 'Preferred language', enum: ['he', 'en'], required: false })
  @IsOptional()
  @IsEnum(['he', 'en'])
  language?: 'he' | 'en';
}
