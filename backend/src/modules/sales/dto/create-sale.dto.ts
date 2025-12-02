import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  IsDateString,
  IsUUID,
  Length,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaleCategory, SaleSource, SaleStatus } from '../entities/sale.entity';

export class CreateSaleDto {
  @ApiProperty({ description: 'Sale title', example: '50% Off Summer Collection' })
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({ description: 'Sale description' })
  @IsString()
  @Length(10, 2000)
  description: string;

  @ApiPropertyOptional({ enum: SaleCategory, default: SaleCategory.OTHER })
  @IsEnum(SaleCategory)
  @IsOptional()
  category?: SaleCategory;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 50 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Original price', example: 199.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Sale price', example: 99.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'ILS' })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Sale start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Sale end date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: SaleStatus, default: SaleStatus.ACTIVE })
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: ['https://example.com/image.jpg'],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Store ID (UUID)' })
  @IsUUID()
  storeId: string;

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

  @ApiPropertyOptional({ enum: SaleSource, default: SaleSource.STORE_DASHBOARD })
  @IsEnum(SaleSource)
  @IsOptional()
  source?: SaleSource;

  @ApiPropertyOptional({ description: 'Source URL (for social media posts)' })
  @IsUrl()
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Source post ID (for social media)' })
  @IsString()
  @IsOptional()
  sourceId?: string;
}
