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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { SaleStatus } from './entities/sale.entity';

@ApiTags('Sales')
@ApiBearerAuth('JWT-auth')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  async create(@Request() req, @Body() createSaleDto: any) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: SaleStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.salesService.findAll({
      category,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find sales nearby (geospatial search)' })
  @ApiQuery({ name: 'lat', required: true, type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in meters (default: 5000)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minDiscount', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius?: number,
    @Query('category') category?: string,
    @Query('minDiscount') minDiscount?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.salesService.findNearby({
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: radius ? Number(radius) : 5000,
      category,
      minDiscount: minDiscount ? Number(minDiscount) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search sales' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minDiscount', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') searchTerm: string,
    @Query('category') category?: string,
    @Query('minDiscount') minDiscount?: number,
    @Query('limit') limit?: number,
  ) {
    return this.salesService.search(searchTerm, {
      category,
      minDiscount: minDiscount ? Number(minDiscount) : undefined,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get sales statistics' })
  @ApiQuery({ name: 'storeId', required: false })
  async getStatistics(@Query('storeId') storeId?: string) {
    return this.salesService.getStatistics(storeId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all sales for a store' })
  async findByStore(@Param('storeId') storeId: string) {
    return this.salesService.findByStore(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  async findOne(@Param('id') id: string) {
    // Increment views
    await this.salesService.incrementViews(id);
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sale' })
  async update(@Param('id') id: string, @Body() updateSaleDto: any) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update sale status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: SaleStatus }) {
    return this.salesService.updateStatus(id, body.status);
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Track sale click' })
  async trackClick(@Param('id') id: string) {
    await this.salesService.incrementClicks(id);
    return { success: true };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Track sale share' })
  async trackShare(@Param('id') id: string) {
    await this.salesService.incrementShares(id);
    return { success: true };
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Track sale save' })
  async trackSave(@Param('id') id: string) {
    await this.salesService.incrementSaves(id);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sale' })
  async remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}
