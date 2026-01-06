import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeminiService } from '../gemini/gemini.service';
import { AnalysisResult } from './dto/analysis-result.dto';
import { Analysis } from './entities/analysis.entity';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly geminiService: GeminiService,
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
  ) {}

  async analyzeShop(file: Express.Multer.File, shopId?: string): Promise<AnalysisResult> {
    this.logger.log(`Analyzing shop image: ${file.originalname} (${file.size} bytes)`);

    try {
      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      let previousAnalysis: string | undefined;

      // If shopId is provided, fetch the latest analysis
      if (shopId) {
        const lastAnalysis = await this.analysisRepository.findOne({
          where: { shopId },
          order: { createdAt: 'DESC' },
        });

        if (lastAnalysis) {
          this.logger.log(`Found previous analysis for shop ${shopId}`);
          previousAnalysis = lastAnalysis.result;
        }
      }

      const result = await this.geminiService.analyzeShopImage(
        base64Image,
        mimeType,
        previousAnalysis,
      );

      // Save the new analysis
      if (shopId) {
        await this.analysisRepository.save({
          shopId,
          result: JSON.stringify(result),
        });
        this.logger.log(`Saved new analysis for shop ${shopId}`);
      }

      this.logger.log('Analysis completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Analysis failed', error.stack);
      throw new InternalServerErrorException(
        'Failed to analyze shop image. Please try again.',
      );
    }
  }
}
