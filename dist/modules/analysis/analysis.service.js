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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gemini_service_1 = require("../gemini/gemini.service");
const analysis_entity_1 = require("./entities/analysis.entity");
let AnalysisService = AnalysisService_1 = class AnalysisService {
    constructor(geminiService, analysisRepository) {
        this.geminiService = geminiService;
        this.analysisRepository = analysisRepository;
        this.logger = new common_1.Logger(AnalysisService_1.name);
    }
    async analyzeShop(file, shopId) {
        this.logger.log(`Analyzing shop image: ${file.originalname} (${file.size} bytes)`);
        try {
            const base64Image = file.buffer.toString('base64');
            const mimeType = file.mimetype;
            let previousAnalysis;
            if (shopId) {
                const lastAnalysis = await this.analysisRepository.findOne({
                    where: { shopId },
                    order: { createdAt: 'DESC' },
                });
                if (lastAnalysis) {
                    this.logger.log(`Found previous analysis for shop ${shopId}`);
                    previousAnalysis = lastAnalysis.result;
                }
            }
            const result = await this.geminiService.analyzeShopImage(base64Image, mimeType, previousAnalysis);
            if (shopId) {
                await this.analysisRepository.save({
                    shopId,
                    result: JSON.stringify(result),
                });
                this.logger.log(`Saved new analysis for shop ${shopId}`);
            }
            this.logger.log('Analysis completed successfully');
            return result;
        }
        catch (error) {
            this.logger.error('Analysis failed', error.stack);
            throw new common_1.InternalServerErrorException('Failed to analyze shop image. Please try again.');
        }
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = AnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(analysis_entity_1.Analysis)),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        typeorm_2.Repository])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map