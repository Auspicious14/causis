import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GeminiModule } from '../gemini/gemini.module';
import { Analysis } from './entities/analysis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Analysis]),
    GeminiModule
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
