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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreOwnerGuard } from './guards/store-owner.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@ApiTags('Stores')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register a new store' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Request() req, @Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create({
      ...createStoreDto,
      ownerId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip (default: 0)',
  })
  async findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const safeLimit = Math.min(Number(limit) || 20, 100); // Default 20, max 100
    const safeOffset = Math.max(Number(offset) || 0, 0); // Default 0, min 0

    return this.storesService.findAll(safeLimit, safeOffset);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find stores nearby' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in meters (default: 5000)',
  })
  async findNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius: number = 5000,
  ) {
    return this.storesService.findNearby(Number(latitude), Number(longitude), Number(radius));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stores' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async search(@Query('q') searchTerm?: string, @Query('category') category?: string) {
    return this.storesService.search(searchTerm, category);
  }

  @Get('my-stores')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user stores' })
  async getMyStores(@Request() req) {
    return this.storesService.findByOwner(req.user.id);
  }

  @Get('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user primary store' })
  async getMyStore(@Request() req) {
    const stores = await this.storesService.findByOwner(req.user.id);
    return stores[0] || null;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  async findOne(@Param('id') id: string) {
    // Increment views
    await this.storesService.incrementViews(id);
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @ApiOperation({ summary: 'Update store' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @ApiOperation({ summary: 'Delete store' })
  async remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
