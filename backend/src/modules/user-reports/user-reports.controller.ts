import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserReportsService } from './user-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateReportDto, ApproveReportDto, RejectReportDto } from './dto';

@ApiTags('User Reports')
@Controller('user-reports')
export class UserReportsController {
  constructor(private readonly reportsService: UserReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a new sale report' })
  async createReport(@Request() req, @Body() dto: CreateReportDto) {
    const result = await this.reportsService.createReport(req.user.id, dto);
    return {
      success: true,
      reportId: result.report.id,
      status: result.report.status,
      pointsEarned: result.pointsEarned,
      aiExtraction: result.aiExtraction,
      message: `Report submitted! +${result.pointsEarned} points`,
    };
  }

  @Get('my-reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user reports' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getMyReports(
    @Request() req,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.reportsService.getUserReports(req.user.id, limit, offset);
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user stats and points' })
  async getMyStats(@Request() req) {
    return this.reportsService.getUserStats(req.user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get pending reports for moderation (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getPendingReports(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.reportsService.getPendingReports(limit, offset);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get reporter leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'all-time'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(
    @Query('period') period: 'weekly' | 'monthly' | 'all-time' = 'weekly',
    @Query('limit') limit = 10,
  ) {
    return this.reportsService.getLeaderboard(period, limit);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve a pending report (admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async approveReport(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ApproveReportDto,
  ) {
    const report = await this.reportsService.approveReport(id, req.user.id, dto);
    return {
      success: true,
      report,
      message: 'Report approved and sale created',
    };
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject a pending report (admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async rejectReport(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RejectReportDto,
  ) {
    const report = await this.reportsService.rejectReport(id, req.user.id, dto);
    return {
      success: true,
      report,
      message: 'Report rejected',
    };
  }
}
