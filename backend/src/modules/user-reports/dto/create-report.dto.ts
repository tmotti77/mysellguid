import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SaleCategory } from '../../sales/entities/sale.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'Base64 encoded image' })
  @IsString()
  image: string;

  @ApiProperty({ description: 'Latitude where report was submitted' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude where report was submitted' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Store ID if known', required: false })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiProperty({ description: 'Store name if new', required: false })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiProperty({ description: 'Override AI-detected title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Override AI-detected description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Override AI-detected category', required: false })
  @IsOptional()
  @IsEnum(SaleCategory)
  category?: SaleCategory;

  @ApiProperty({ description: 'Override AI-detected discount %', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiProperty({ description: 'Original price', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ description: 'Sale price', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;
}

export class ApproveReportDto {
  @ApiProperty({ description: 'Final title for the sale' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Sale category' })
  @IsEnum(SaleCategory)
  category: SaleCategory;

  @ApiProperty({ description: 'Discount percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiProperty({ description: 'Original price', required: false })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiProperty({ description: 'Sale price', required: false })
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiProperty({ description: 'Sale description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Store ID to associate', required: false })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

export class RejectReportDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  reason: string;
}
