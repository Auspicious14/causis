"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const shop_analysis_prompt_1 = require("./prompts/shop-analysis.prompt");
let GeminiService = GeminiService_1 = class GeminiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GeminiService_1.name);
        const apiKey = this.configService.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured");
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });
    }
    async analyzeShopImage(base64Image, mimeType) {
        const startTime = Date.now();
        const maxRetries = 3;
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                this.logger.log(`Sending image to Gemini API (Attempt ${attempt + 1}/${maxRetries})...`);
                const imagePart = {
                    inlineData: {
                        data: base64Image,
                        mimeType: mimeType,
                    },
                };
                const result = await this.model.generateContent([
                    shop_analysis_prompt_1.SHOP_ANALYSIS_SYSTEM_PROMPT,
                    imagePart,
                ]);
                const response = await result.response;
                const rawText = response.text();
                const latency = Date.now() - startTime;
                this.logger.log(`Gemini API responded in ${latency}ms`);
                const parsedResult = this.parseGeminiResponse(rawText);
                return parsedResult;
            }
            catch (error) {
                attempt++;
                const isRetryable = error.message?.includes("503") ||
                    error.message?.includes("overloaded") ||
                    error.status === 503;
                if (isRetryable && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    this.logger.warn(`Gemini API overloaded or unavailable. Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                this.logger.error("Gemini API call failed", error.stack);
                throw error;
            }
        }
    }
    parseGeminiResponse(rawText) {
        try {
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                rawText.match(/```\s*([\s\S]*?)\s*```/);
            const jsonText = jsonMatch ? jsonMatch[1] : rawText;
            const parsed = JSON.parse(jsonText.trim());
            return {
                understanding: {
                    title: parsed.understanding?.title ||
                        parsed.currentUnderstanding?.title ||
                        "Shop Analysis",
                    description: parsed.understanding?.description ||
                        parsed.currentUnderstanding?.description ||
                        "",
                    strengths: parsed.understanding?.strengths ||
                        parsed.currentUnderstanding?.strengths ||
                        [],
                },
                hiddenIssues: (parsed.hiddenIssues || []).map((issue) => ({
                    issue: issue.issue || issue.title || "",
                    impact: issue.impact || issue.description || "",
                    severity: this.normalizeSeverity(issue.severity || issue.priority),
                })),
                futureOutcome: {
                    withoutChanges: parsed.futureOutcome?.withoutChanges ||
                        parsed.likelyFutureOutcome?.withoutChanges ||
                        "",
                    withChanges: parsed.futureOutcome?.withChanges ||
                        parsed.likelyFutureOutcome?.withChanges ||
                        "",
                },
                recommendations: (parsed.recommendations ||
                    parsed.recommendedActions ||
                    []).map((rec) => ({
                    action: rec.action || rec.title || "",
                    why: rec.why || rec.explanation || rec.reason || "",
                    priority: this.normalizePriority(rec.priority || rec.rank),
                    cost: rec.cost || "Not specified",
                    timeframe: rec.timeframe || rec.timeline || "Not specified",
                })),
            };
        }
        catch (error) {
            this.logger.error("Failed to parse Gemini response", error.stack);
            return this.createFallbackResponse(rawText);
        }
    }
    normalizeSeverity(value) {
        if (!value)
            return "medium";
        const str = String(value).toLowerCase();
        if (str.includes("high") || str === "1")
            return "high";
        if (str.includes("low") || str === "3")
            return "low";
        return "medium";
    }
    normalizePriority(value) {
        if (!value)
            return "medium";
        const str = String(value).toLowerCase();
        if (str.includes("high") || str === "1")
            return "high";
        if (str.includes("low") || str === "3")
            return "low";
        return "medium";
    }
    createFallbackResponse(rawText) {
        return {
            understanding: {
                title: "Analysis Completed",
                description: "The AI has analyzed your shop. See recommendations below.",
                strengths: [],
            },
            hiddenIssues: [
                {
                    issue: "Response Parsing Issue",
                    impact: "The AI response could not be fully structured. Raw analysis is available in logs.",
                    severity: "low",
                },
            ],
            futureOutcome: {
                withoutChanges: "Unable to parse future outcome.",
                withChanges: "Please try uploading another image for detailed analysis.",
            },
            recommendations: [
                {
                    action: "Review Raw Analysis",
                    why: "The detailed analysis is available but needs manual review.",
                    priority: "medium",
                    cost: "None",
                    timeframe: "Immediate",
                },
            ],
        };
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map