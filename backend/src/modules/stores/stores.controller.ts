import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Stores')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register a new store' })
  async create(@Request() req, @Body() createStoreDto: any) {
    return this.storesService.create({
      ...createStoreDto,
      ownerId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores' })
  async findAll() {
    return this.storesService.findAll();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find stores nearby' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in meters (default: 5000)' })
  async findNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius: number = 5000,
  ) {
    return this.storesService.findNearby(
      Number(latitude),
      Number(longitude),
      Number(radius),
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stores' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async search(
    @Query('q') searchTerm?: string,
    @Query('category') category?: string,
  ) {
    return this.storesService.search(searchTerm, category);
  }

  @Get('my-stores')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user stores' })
  async getMyStores(@Request() req) {
    return this.storesService.findByOwner(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  async findOne(@Param('id') id: string) {
    // Increment views
    await this.storesService.incrementViews(id);
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update store' })
  async update(@Param('id') id: string, @Body() updateStoreDto: any, @Request() req) {
    // Check ownership
    const store = await this.storesService.findOne(id);
    if (store.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own stores');
    }
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete store' })
  async remove(@Param('id') id: string, @Request() req) {
    // Check ownership
    const store = await this.storesService.findOne(id);
    if (store.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own stores');
    }
    return this.storesService.remove(id);
  }
}
