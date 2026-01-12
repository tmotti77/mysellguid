import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
