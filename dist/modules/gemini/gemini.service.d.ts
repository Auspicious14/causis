import { ConfigService } from "@nestjs/config";
import { AnalysisResult } from "../analysis/dto/analysis-result.dto";
export declare class GeminiService {
    private readonly configService;
    private readonly logger;
    private readonly genAI;
    private readonly model;
    constructor(configService: ConfigService);
    analyzeShopImage(base64Image: string, mimeType: string, previousAnalysis?: string): Promise<AnalysisResult>;
    checkSceneConsistency(base64Image: string, mimeType: string, previousAnalysis: string): Promise<{
        isSameEnvironment: boolean;
        confidence: "high" | "medium" | "low";
        reasoning: string;
    }>;
    private parseGeminiResponse;
    private normalizeSeverity;
    private normalizePriority;
    private createFallbackResponse;
}
