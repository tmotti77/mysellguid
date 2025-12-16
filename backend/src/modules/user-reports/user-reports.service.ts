import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReport, ReportStatus } from './entities/user-report.entity';
import { UserStats, TrustLevel } from './entities/user-stats.entity';
import { Sale, SaleStatus, SaleSource } from '../sales/entities/sale.entity';
import { MlService } from '../ml/ml.service';
import { UploadService } from '../upload/upload.service';
import { CreateReportDto, ApproveReportDto, RejectReportDto } from './dto';

const POINTS = {
  SUBMIT_REPORT: 10,
  REPORT_APPROVED: 5,
  REPORT_REJECTED: -10,
  FIRST_TO_REPORT: 15,
  STORE_VERIFIED: 20,
  RECEIVE_UPVOTE: 1,
};

const TRUST_THRESHOLDS = {
  REGULAR: { reports: 5, accuracy: 70 },
  TRUSTED: { reports: 20, accuracy: 85 },
  EXPERT: { reports: 50, accuracy: 90 },
};

@Injectable()
export class UserReportsService {
  constructor(
    @InjectRepository(UserReport)
    private reportsRepository: Repository<UserReport>,
    @InjectRepository(UserStats)
    private statsRepository: Repository<UserStats>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    private mlService: MlService,
    private uploadService: UploadService,
  ) {}

  async createReport(
    userId: string,
    dto: CreateReportDto,
  ): Promise<{ report: UserReport; pointsEarned: number; aiExtraction: any }> {
    let imageUrl: string;
    try {
      const uploadResult = await this.uploadService.uploadBase64Image(dto.image);
      imageUrl = uploadResult.url;
    } catch {
      throw new BadRequestException('Failed to upload image');
    }

    let aiExtraction: any = null;
    try {
      aiExtraction = await this.mlService.analyzeImage(imageUrl);
    } catch (error) {
      console.error('AI analysis failed:', error);
    }

    const rawData = {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      discountPercentage: dto.discountPercentage,
      originalPrice: dto.originalPrice,
      salePrice: dto.salePrice,
      storeId: dto.storeId,
      storeName: dto.storeName,
    };

    const report = this.reportsRepository.create({
      userId,
      imageUrl,
      rawData,
      aiExtractedData: aiExtraction,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location: `POINT(${dto.longitude} ${dto.latitude})`,
      status: ReportStatus.PENDING,
    });

    await this.reportsRepository.save(report);

    const stats = await this.getOrCreateStats(userId);
    stats.reportCount += 1;
    stats.points += POINTS.SUBMIT_REPORT;
    stats.lastReportAt = new Date();
    await this.statsRepository.save(stats);

    const shouldAutoApprove = await this.shouldAutoApprove(userId, aiExtraction);
    if (shouldAutoApprove) {
      await this.autoApproveReport(report, aiExtraction, rawData);
    }

    return {
      report,
      pointsEarned: POINTS.SUBMIT_REPORT,
      aiExtraction,
    };
  }

  private async shouldAutoApprove(
    userId: string,
    aiExtraction: any,
  ): Promise<boolean> {
    const stats = await this.getOrCreateStats(userId);

    if (stats.trustLevel === TrustLevel.TRUSTED || stats.trustLevel === TrustLevel.EXPERT) {
      return true;
    }

    if (aiExtraction?.confidence && aiExtraction.confidence > 90) {
      if (stats.trustLevel === TrustLevel.REGULAR) {
        return true;
      }
    }

    return false;
  }

  private async autoApproveReport(
    report: UserReport,
    aiExtraction: any,
    rawData: any,
  ): Promise<void> {
    const saleData = {
      title: rawData.title || aiExtraction?.title || 'Reported Sale',
      description: rawData.description || aiExtraction?.description || '',
      category: rawData.category || aiExtraction?.category || 'other',
      discountPercentage: rawData.discountPercentage || aiExtraction?.discountPercentage || 0,
      originalPrice: rawData.originalPrice || aiExtraction?.originalPrice,
      salePrice: rawData.salePrice || aiExtraction?.salePrice,
      storeId: rawData.storeId,
      latitude: report.latitude,
      longitude: report.longitude,
      location: report.location,
      images: [report.imageUrl],
      source: SaleSource.USER_REPORT,
      status: SaleStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const sale = this.salesRepository.create(saleData);
    await this.salesRepository.save(sale);

    report.saleId = sale.id;
    report.status = ReportStatus.APPROVED;
    report.pointsAwarded = POINTS.SUBMIT_REPORT + POINTS.REPORT_APPROVED;
    await this.reportsRepository.save(report);

    const stats = await this.getOrCreateStats(report.userId);
    stats.approvedCount += 1;
    stats.points += POINTS.REPORT_APPROVED;
    await this.updateTrustLevel(stats);
    await this.statsRepository.save(stats);
  }

  async approveReport(
    reportId: string,
    verifierId: string,
    dto: ApproveReportDto,
  ): Promise<UserReport> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new ConflictException('Report already processed');
    }

    const saleData = {
      title: dto.title,
      description: dto.description || '',
      category: dto.category,
      discountPercentage: dto.discountPercentage,
      originalPrice: dto.originalPrice,
      salePrice: dto.salePrice,
      storeId: dto.storeId,
      latitude: report.latitude,
      longitude: report.longitude,
      location: report.location,
      images: [report.imageUrl],
      source: SaleSource.USER_REPORT,
      status: SaleStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const sale = this.salesRepository.create(saleData);
    await this.salesRepository.save(sale);

    report.saleId = sale.id;
    report.status = ReportStatus.APPROVED;
    report.verifiedBy = verifierId;
    report.pointsAwarded = POINTS.SUBMIT_REPORT + POINTS.REPORT_APPROVED;
    await this.reportsRepository.save(report);

    const stats = await this.getOrCreateStats(report.userId);
    stats.approvedCount += 1;
    stats.points += POINTS.REPORT_APPROVED;
    await this.updateTrustLevel(stats);
    await this.statsRepository.save(stats);

    return report;
  }

  async rejectReport(
    reportId: string,
    verifierId: string,
    dto: RejectReportDto,
  ): Promise<UserReport> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new ConflictException('Report already processed');
    }

    report.status = ReportStatus.REJECTED;
    report.verifiedBy = verifierId;
    report.verificationNote = dto.reason;
    await this.reportsRepository.save(report);

    const stats = await this.getOrCreateStats(report.userId);
    stats.rejectedCount += 1;
    stats.points = Math.max(0, stats.points + POINTS.REPORT_REJECTED);
    await this.updateTrustLevel(stats);
    await this.statsRepository.save(stats);

    return report;
  }

  async getPendingReports(limit = 50, offset = 0): Promise<UserReport[]> {
    return this.reportsRepository.find({
      where: { status: ReportStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async getUserReports(userId: string, limit = 50, offset = 0): Promise<UserReport[]> {
    return this.reportsRepository.find({
      where: { userId },
      relations: ['sale'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return this.getOrCreateStats(userId);
  }

  async getLeaderboard(
    period: 'weekly' | 'monthly' | 'all-time' = 'weekly',
    limit = 10,
  ): Promise<any[]> {
    let dateFilter = new Date();
    
    if (period === 'weekly') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'monthly') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else {
      dateFilter = new Date(0);
    }

    const query = `
      SELECT 
        us."userId",
        u."firstName",
        u."lastName",
        u.avatar,
        us.points,
        us."approvedCount",
        us.badges,
        us."trustLevel"
      FROM user_stats us
      JOIN users u ON us."userId" = u.id
      WHERE us."updatedAt" >= $1
      ORDER BY us.points DESC
      LIMIT $2
    `;

    return this.statsRepository.query(query, [dateFilter, limit]);
  }

  private async getOrCreateStats(userId: string): Promise<UserStats> {
    let stats = await this.statsRepository.findOne({ where: { userId } });
    
    if (!stats) {
      stats = this.statsRepository.create({
        userId,
        reportCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        points: 0,
        badges: [],
        trustLevel: TrustLevel.NEW,
      });
      await this.statsRepository.save(stats);
    }

    return stats;
  }

  private async updateTrustLevel(stats: UserStats): Promise<void> {
    const totalReports = stats.approvedCount + stats.rejectedCount;
    const accuracy = totalReports > 0 ? (stats.approvedCount / totalReports) * 100 : 0;

    if (
      stats.approvedCount >= TRUST_THRESHOLDS.EXPERT.reports &&
      accuracy >= TRUST_THRESHOLDS.EXPERT.accuracy
    ) {
      stats.trustLevel = TrustLevel.EXPERT;
    } else if (
      stats.approvedCount >= TRUST_THRESHOLDS.TRUSTED.reports &&
      accuracy >= TRUST_THRESHOLDS.TRUSTED.accuracy
    ) {
      stats.trustLevel = TrustLevel.TRUSTED;
    } else if (
      stats.approvedCount >= TRUST_THRESHOLDS.REGULAR.reports &&
      accuracy >= TRUST_THRESHOLDS.REGULAR.accuracy
    ) {
      stats.trustLevel = TrustLevel.REGULAR;
    } else {
      stats.trustLevel = TrustLevel.NEW;
    }
  }
}
