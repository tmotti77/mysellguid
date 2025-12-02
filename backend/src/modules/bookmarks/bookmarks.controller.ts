import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookmarks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':saleId')
  @ApiOperation({ summary: 'Bookmark a sale' })
  @ApiParam({ name: 'saleId', description: 'Sale ID to bookmark' })
  @ApiResponse({ status: 201, description: 'Sale bookmarked successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @ApiResponse({ status: 409, description: 'Sale already bookmarked' })
  async addBookmark(@Request() req, @Param('saleId') saleId: string) {
    const bookmark = await this.bookmarksService.addBookmark(req.user.id, saleId);
    return {
      message: 'Sale bookmarked successfully',
      bookmarked: true,
      createdAt: bookmark.createdAt,
    };
  }

  @Delete(':saleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove bookmark from a sale' })
  @ApiParam({ name: 'saleId', description: 'Sale ID to unbookmark' })
  @ApiResponse({ status: 204, description: 'Bookmark removed successfully' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  async removeBookmark(@Request() req, @Param('saleId') saleId: string) {
    await this.bookmarksService.removeBookmark(req.user.id, saleId);
  }

  @Get('check/:saleId')
  @ApiOperation({ summary: 'Check if a sale is bookmarked' })
  @ApiParam({ name: 'saleId', description: 'Sale ID to check' })
  @ApiResponse({ status: 200, description: 'Bookmark status returned' })
  async checkBookmark(@Request() req, @Param('saleId') saleId: string) {
    const isBookmarked = await this.bookmarksService.isBookmarked(req.user.id, saleId);
    return { saleId, isBookmarked };
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookmarked sales for current user' })
  @ApiQuery({
    name: 'lat',
    required: false,
    description: 'User latitude for distance calculation',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    description: 'User longitude for distance calculation',
  })
  @ApiResponse({ status: 200, description: 'Bookmarked sales returned' })
  async getUserBookmarks(@Request() req, @Query('lat') lat?: string, @Query('lng') lng?: string) {
    // If coordinates provided, return with distance
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      const sales = await this.bookmarksService.getUserBookmarksWithDistance(
        req.user.id,
        latitude,
        longitude,
      );

      return {
        count: sales.length,
        sales,
      };
    }

    // Otherwise, return basic bookmark list
    const sales = await this.bookmarksService.getUserBookmarks(req.user.id);

    return {
      count: sales.length,
      sales,
    };
  }
}
