import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GeminiService } from "../gemini/gemini.service";
import { AnalysisResult } from "./dto/analysis-result.dto";
import { Analysis } from "./entities/analysis.entity";

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly geminiService: GeminiService,
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>
  ) {}

  async analyzeShop(
    file: Express.Multer.File,
    shopId?: string
  ): Promise<AnalysisResult> {
    this.logger.log(
      `Analyzing shop image: ${file.originalname} (${file.size} bytes)`
    );

    try {
      const base64Image = file.buffer.toString("base64");
      const mimeType = file.mimetype;

      let previousAnalysis: string | undefined;
      let identityMismatch: any = undefined;

      // If shopId is provided, fetch the latest analysis
      if (shopId) {
        const lastAnalysis = await this.analysisRepository.findOne({
          where: { shopId },
          order: { createdAt: "DESC" },
        });

        if (lastAnalysis) {
          this.logger.log(
            `Found previous analysis for shop ${shopId}. Verifying consistency...`
          );
          previousAnalysis = lastAnalysis.result;

          const consistency = await this.geminiService.checkSceneConsistency(
            base64Image,
            mimeType,
            previousAnalysis
          );

          if (
            !consistency.isSameEnvironment &&
            consistency.confidence === "high"
          ) {
            this.logger.warn(
              `Scene consistency mismatch detected for shop ${shopId}`
            );
            identityMismatch = {
              isMismatch: true,
              reasoning: consistency.reasoning,
              confidence: consistency.confidence,
            };

            // In case of mismatch, we don't proceed with temporal analysis
            // but we still return the shopId so FE knows which session triggered it
            return {
              shopId,
              identityMismatch,
              understanding: {
                title: "Identity Mismatch",
                description: consistency.reasoning,
                strengths: [],
              },
              hiddenIssues: [],
              futureOutcome: { withoutChanges: "", withChanges: "" },
              recommendations: [],
            } as AnalysisResult;
          }
        }
      }

      const result = await this.geminiService.analyzeShopImage(
        base64Image,
        mimeType,
        previousAnalysis
      );

      // Save the new analysis
      const finalShopId = shopId || randomUUID();

      await this.analysisRepository.save({
        shopId: finalShopId,
        result: JSON.stringify(result),
      });

      this.logger.log(`Saved analysis for shop ${finalShopId}`);

      this.logger.log("Analysis completed successfully");

      return {
        ...result,
        shopId: finalShopId,
      };
    } catch (error) {
      this.logger.error("Analysis failed", error.stack);
      throw new InternalServerErrorException(
        "Failed to analyze shop image. Please try again."
      );
    }
  }
}
