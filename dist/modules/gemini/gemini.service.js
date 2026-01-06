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
    async analyzeShopImage(base64Image, mimeType, previousAnalysis) {
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
                let parts;
                if (previousAnalysis) {
                    parts = [(0, shop_analysis_prompt_1.TEMPORAL_COMPARISON_PROMPT)(previousAnalysis), imagePart];
                }
                else {
                    parts = [shop_analysis_prompt_1.SHOP_ANALYSIS_SYSTEM_PROMPT, imagePart];
                }
                const result = await this.model.generateContent(parts);
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
    async checkSceneConsistency(base64Image, mimeType, previousAnalysis) {
        try {
            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            };
            const parts = [(0, shop_analysis_prompt_1.SCENE_CONSISTENCY_PROMPT)(previousAnalysis), imagePart];
            const result = await this.model.generateContent(parts);
            const response = await result.response;
            const rawText = response.text();
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                rawText.match(/```\s*([\s\S]*?)\s*```/);
            const jsonText = jsonMatch ? jsonMatch[1] : rawText;
            const parsed = JSON.parse(jsonText.trim());
            return {
                isSameEnvironment: !!parsed.is_same_environment,
                confidence: parsed.confidence || "medium",
                reasoning: parsed.reasoning || "",
            };
        }
        catch (error) {
            this.logger.error("Scene consistency check failed", error.stack);
            return {
                isSameEnvironment: true,
                confidence: "low",
                reasoning: "Check failed, proceeding with caution.",
            };
        }
    }
    parseGeminiResponse(rawText) {
        try {
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                rawText.match(/```\s*([\s\S]*?)\s*```/);
            const jsonText = jsonMatch ? jsonMatch[1] : rawText;
            const parsed = JSON.parse(jsonText.trim());
            const isTemporal = !!parsed.changes_detected || !!parsed.updated_state_summary;
            return {
                understanding: {
                    title: parsed.understanding?.title ||
                        parsed.currentUnderstanding?.title ||
                        parsed.scene_type ||
                        (isTemporal ? "Shop Evolution Analysis" : "Shop Analysis"),
                    description: parsed.updated_state_summary ||
                        parsed.understanding?.description ||
                        parsed.currentUnderstanding?.description ||
                        parsed.current_understanding ||
                        "",
                    strengths: parsed.understanding?.strengths ||
                        parsed.currentUnderstanding?.strengths ||
                        parsed.strengths ||
                        [],
                },
                changes: parsed.changes_detected
                    ? {
                        detected: parsed.changes_detected.length > 0,
                        improvements: parsed.changes_detected
                            .filter((c) => c.direction === "improved")
                            .map((c) => c.change),
                        regressions: parsed.changes_detected
                            .filter((c) => c.direction === "worsened")
                            .map((c) => c.change),
                        description: parsed.changes_detected
                            .map((c) => `${c.change} (${c.direction}): ${c.evidence}`)
                            .join("\n"),
                    }
                    : parsed.changes || parsed.comparison_result || undefined,
                hiddenIssues: (parsed.issue_trends ||
                    parsed.hiddenIssues ||
                    parsed.hidden_issues ||
                    []).map((issue) => ({
                    issue: issue.issue || issue.title || "",
                    impact: issue.reasoning ||
                        issue.impact ||
                        issue.description ||
                        issue.explanation ||
                        "",
                    severity: this.normalizeSeverity(issue.trend === "worsening"
                        ? "high"
                        : issue.severity || issue.priority),
                })),
                futureOutcome: {
                    withoutChanges: parsed.futureOutcome?.withoutChanges ||
                        parsed.likelyFutureOutcome?.withoutChanges ||
                        parsed.future_outlook?.without_changes ||
                        "",
                    withChanges: parsed.futureOutcome?.withChanges ||
                        parsed.likelyFutureOutcome?.withChanges ||
                        parsed.future_outlook?.with_changes ||
                        "",
                },
                recommendations: (parsed.updated_recommendations ||
                    parsed.recommendations ||
                    parsed.recommendedActions ||
                    parsed.recommended_actions ||
                    []).map((rec) => ({
                    action: rec.action || rec.title || "",
                    why: rec.reasoning || rec.why || rec.explanation || rec.reason || "",
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