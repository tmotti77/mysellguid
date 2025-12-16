import { IsString, IsOptional, IsEmail, IsEnum, IsUrl, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'User phone number', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ description: 'New password (min 6 characters)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
