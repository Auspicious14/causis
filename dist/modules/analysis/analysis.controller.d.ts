import { AnalysisService } from './analysis.service';
export declare class AnalysisController {
    private readonly analysisService;
    constructor(analysisService: AnalysisService);
    analyzeShop(file: Express.Multer.File, shopId?: string): Promise<import("./dto/analysis-result.dto").AnalysisResult>;
}
