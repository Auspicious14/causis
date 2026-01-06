import { ConfigService } from "@nestjs/config";
import { AnalysisResult } from "../analysis/dto/analysis-result.dto";
export declare class GeminiService {
    private readonly configService;
    private readonly logger;
    private readonly genAI;
    private readonly model;
    constructor(configService: ConfigService);
    analyzeShopImage(base64Image: string, mimeType: string, previousAnalysis?: string): Promise<AnalysisResult>;
    private parseGeminiResponse;
    private normalizeSeverity;
    private normalizePriority;
    private createFallbackResponse;
}
