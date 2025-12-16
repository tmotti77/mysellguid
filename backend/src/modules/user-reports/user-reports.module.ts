import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReportsController } from './user-reports.controller';
import { UserReportsService } from './user-reports.service';
import { UserReport } from './entities/user-report.entity';
import { UserStats } from './entities/user-stats.entity';
import { Sale } from '../sales/entities/sale.entity';
import { MlModule } from '../ml/ml.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserReport, UserStats, Sale]),
    MlModule,
    UploadModule,
  ],
  controllers: [UserReportsController],
  providers: [UserReportsService],
  exports: [UserReportsService],
})
export class UserReportsModule {}
