import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async update(@Request() req, @Body() updateData: any) {
    return this.usersService.update(req.user.id, updateData);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(@Request() req, @Body() preferences: any) {
    return this.usersService.updatePreferences(req.user.id, preferences);
  }

  @Patch('me/location')
  @ApiOperation({ summary: 'Update user default location' })
  async updateLocation(
    @Request() req,
    @Body() location: { latitude: number; longitude: number },
  ) {
    return this.usersService.updateLocation(
      req.user.id,
      location.latitude,
      location.longitude,
    );
  }

  @Patch('me/fcm-token')
  @ApiOperation({ summary: 'Update FCM token for push notifications' })
  async updateFcmToken(@Request() req, @Body() body: { fcmToken: string }) {
    return this.usersService.updateFcmToken(req.user.id, body.fcmToken);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  async remove(@Request() req) {
    return this.usersService.remove(req.user.id);
  }
}
