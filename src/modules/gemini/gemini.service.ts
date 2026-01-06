import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  SHOP_ANALYSIS_SYSTEM_PROMPT,
  TEMPORAL_COMPARISON_PROMPT,
} from "./prompts/shop-analysis.prompt";
import { AnalysisResult } from "../analysis/dto/analysis-result.dto";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }

  async analyzeShopImage(
    base64Image: string,
    mimeType: string,
    previousAnalysis?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        this.logger.log(
          `Sending image to Gemini API (Attempt ${
            attempt + 1
          }/${maxRetries})...`
        );

        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        };

        let parts: any[];

        if (previousAnalysis) {
          parts = [TEMPORAL_COMPARISON_PROMPT(previousAnalysis), imagePart];
        } else {
          parts = [SHOP_ANALYSIS_SYSTEM_PROMPT, imagePart];
        }

        const result = await this.model.generateContent(parts);

        const response = await result.response;
        const rawText = response.text();

        const latency = Date.now() - startTime;
        this.logger.log(`Gemini API responded in ${latency}ms`);

        // Parse the structured response
        const parsedResult = this.parseGeminiResponse(rawText);

        return parsedResult;
      } catch (error) {
        attempt++;
        const isRetryable =
          error.message?.includes("503") ||
          error.message?.includes("overloaded") ||
          error.status === 503;

        if (isRetryable && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          this.logger.warn(
            `Gemini API overloaded or unavailable. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        this.logger.error("Gemini API call failed", error.stack);
        throw error;
      }
    }
  }

  private parseGeminiResponse(rawText: string): AnalysisResult {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawText.match(/```\s*([\s\S]*?)\s*```/);

      const jsonText = jsonMatch ? jsonMatch[1] : rawText;
      const parsed = JSON.parse(jsonText.trim());

      // Validate and normalize the structure
      // Map temporal reasoning output if present
      const isTemporal =
        !!parsed.changes_detected || !!parsed.updated_state_summary;

      return {
        understanding: {
          title:
            parsed.understanding?.title ||
            parsed.currentUnderstanding?.title ||
            parsed.scene_type ||
            (isTemporal ? "Shop Evolution Analysis" : "Shop Analysis"),
          description:
            parsed.updated_state_summary ||
            parsed.understanding?.description ||
            parsed.currentUnderstanding?.description ||
            parsed.current_understanding ||
            "",
          strengths:
            parsed.understanding?.strengths ||
            parsed.currentUnderstanding?.strengths ||
            parsed.strengths ||
            [],
        },
        changes: parsed.changes_detected
          ? {
              detected: parsed.changes_detected.length > 0,
              improvements: parsed.changes_detected
                .filter((c: any) => c.direction === "improved")
                .map((c: any) => c.change),
              regressions: parsed.changes_detected
                .filter((c: any) => c.direction === "worsened")
                .map((c: any) => c.change),
              description: parsed.changes_detected
                .map((c: any) => `${c.change} (${c.direction}): ${c.evidence}`)
                .join("\n"),
            }
          : parsed.changes || parsed.comparison_result || undefined,
        hiddenIssues: (
          parsed.issue_trends ||
          parsed.hiddenIssues ||
          parsed.hidden_issues ||
          []
        ).map((issue: any) => ({
          issue: issue.issue || issue.title || "",
          impact:
            issue.reasoning ||
            issue.impact ||
            issue.description ||
            issue.explanation ||
            "",
          severity: this.normalizeSeverity(
            issue.trend === "worsening"
              ? "high"
              : issue.severity || issue.priority
          ),
        })),
        futureOutcome: {
          withoutChanges:
            parsed.futureOutcome?.withoutChanges ||
            parsed.likelyFutureOutcome?.withoutChanges ||
            parsed.future_outlook?.without_changes ||
            "",
          withChanges:
            parsed.futureOutcome?.withChanges ||
            parsed.likelyFutureOutcome?.withChanges ||
            parsed.future_outlook?.with_changes ||
            "",
        },
        recommendations: (
          parsed.updated_recommendations ||
          parsed.recommendations ||
          parsed.recommendedActions ||
          parsed.recommended_actions ||
          []
        ).map((rec: any) => ({
          action: rec.action || rec.title || "",
          why: rec.reasoning || rec.why || rec.explanation || rec.reason || "",
          priority: this.normalizePriority(rec.priority || rec.rank),
          cost: rec.cost || "Not specified",
          timeframe: rec.timeframe || rec.timeline || "Not specified",
        })),
      };
    } catch (error) {
      this.logger.error("Failed to parse Gemini response", error.stack);

      // Return a fallback structure with the raw text
      return this.createFallbackResponse(rawText);
    }
  }

  private normalizeSeverity(value: any): "low" | "medium" | "high" {
    if (!value) return "medium";
    const str = String(value).toLowerCase();
    if (str.includes("high") || str === "1") return "high";
    if (str.includes("low") || str === "3") return "low";
    return "medium";
  }

  private normalizePriority(value: any): "low" | "medium" | "high" {
    if (!value) return "medium";
    const str = String(value).toLowerCase();
    if (str.includes("high") || str === "1") return "high";
    if (str.includes("low") || str === "3") return "low";
    return "medium";
  }

  private createFallbackResponse(rawText: string): AnalysisResult {
    return {
      understanding: {
        title: "Analysis Completed",
        description:
          "The AI has analyzed your shop. See recommendations below.",
        strengths: [],
      },
      hiddenIssues: [
        {
          issue: "Response Parsing Issue",
          impact:
            "The AI response could not be fully structured. Raw analysis is available in logs.",
          severity: "low",
        },
      ],
      futureOutcome: {
        withoutChanges: "Unable to parse future outcome.",
        withChanges:
          "Please try uploading another image for detailed analysis.",
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
}
