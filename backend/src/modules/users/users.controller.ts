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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserSavedSalesService } from './user-saved-sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly savedSalesService: UserSavedSalesService,
  ) {}

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
  async updateLocation(@Request() req, @Body() location: { latitude: number; longitude: number }) {
    return this.usersService.updateLocation(req.user.id, location.latitude, location.longitude);
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

  // Saved Sales Endpoints
  @Get('me/saved-sales')
  @ApiOperation({ summary: 'Get user saved sales' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max items (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Skip items (default: 0)',
  })
  async getSavedSales(
    @Request() req,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.savedSalesService.getUserSavedSales(
      req.user.id,
      Math.min(Number(limit), 100),
      Math.max(Number(offset), 0),
    );
  }

  @Post('me/saved-sales/:saleId')
  @ApiOperation({ summary: 'Save a sale to favorites' })
  async saveSale(
    @Request() req,
    @Param('saleId') saleId: string,
    @Body() body?: { metadata?: any },
  ) {
    return this.savedSalesService.saveSale(req.user.id, saleId, body?.metadata);
  }

  @Delete('me/saved-sales/:saleId')
  @ApiOperation({ summary: 'Remove a sale from favorites' })
  async unsaveSale(@Request() req, @Param('saleId') saleId: string) {
    await this.savedSalesService.unsaveSale(req.user.id, saleId);
    return { success: true, message: 'Sale removed from favorites' };
  }

  @Get('me/saved-sales/:saleId/check')
  @ApiOperation({ summary: 'Check if sale is saved' })
  async checkSaleSaved(@Request() req, @Param('saleId') saleId: string) {
    const isSaved = await this.savedSalesService.isSaleSaved(req.user.id, saleId);
    return { isSaved };
  }

  @Get('me/saved-sales/count')
  @ApiOperation({ summary: 'Get count of saved sales' })
  async getSavedSalesCount(@Request() req) {
    const count = await this.savedSalesService.getSavedSalesCount(req.user.id);
    return { count };
  }
}
