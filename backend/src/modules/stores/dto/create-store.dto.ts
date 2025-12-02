import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsEmail,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreCategory } from '../entities/store.entity';

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name', example: 'Fashion Paradise' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Store description' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({ enum: StoreCategory, default: StoreCategory.OTHER })
  @IsEnum(StoreCategory)
  @IsOptional()
  category?: StoreCategory;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsString()
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Store email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+972-50-123-4567' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Instagram handle', example: '@fashionparadise' })
  @IsString()
  @IsOptional()
  @Matches(/^@?[\w.]+$/)
  instagramHandle?: string;

  @ApiPropertyOptional({ description: 'Facebook page URL' })
  @IsString()
  @IsOptional()
  facebookPage?: string;

  @ApiProperty({ description: 'Street address', example: 'Dizengoff St 123' })
  @IsString()
  @Length(5, 200)
  address: string;

  @ApiProperty({ description: 'City', example: 'Tel Aviv' })
  @IsString()
  @Length(2, 100)
  city: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Israel' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude (-90 to 90)', example: 32.0853 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (-180 to 180)', example: 34.7818 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Opening hours',
    example: {
      monday: { open: '09:00', close: '21:00' },
      sunday: { open: '10:00', close: '18:00' },
    },
  })
  @IsOptional()
  openingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
}
