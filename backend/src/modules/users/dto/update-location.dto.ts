import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ description: 'Latitude coordinate', example: 32.0853 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 34.7818 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
