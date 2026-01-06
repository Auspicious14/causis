import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { AnalysisResult } from './dto/analysis-result.dto';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly geminiService: GeminiService) {}

  async analyzeShop(file: Express.Multer.File): Promise<AnalysisResult> {
    this.logger.log(`Analyzing shop image: ${file.originalname} (${file.size} bytes)`);

    try {
      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      const result = await this.geminiService.analyzeShopImage(
        base64Image,
        mimeType,
      );

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
