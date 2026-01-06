import { GeminiService } from '../gemini/gemini.service';
import { AnalysisResult } from './dto/analysis-result.dto';
export declare class AnalysisService {
    private readonly geminiService;
    private readonly logger;
    constructor(geminiService: GeminiService);
    analyzeShop(file: Express.Multer.File): Promise<AnalysisResult>;
}
