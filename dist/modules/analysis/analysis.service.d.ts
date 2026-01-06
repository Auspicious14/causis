import { Repository } from 'typeorm';
import { GeminiService } from '../gemini/gemini.service';
import { AnalysisResult } from './dto/analysis-result.dto';
import { Analysis } from './entities/analysis.entity';
export declare class AnalysisService {
    private readonly geminiService;
    private readonly analysisRepository;
    private readonly logger;
    constructor(geminiService: GeminiService, analysisRepository: Repository<Analysis>);
    analyzeShop(file: Express.Multer.File, shopId?: string): Promise<AnalysisResult>;
}
