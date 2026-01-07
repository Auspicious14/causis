import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalysisModule } from "./modules/analysis/analysis.module";
import { Analysis } from "./modules/analysis/entities/analysis.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    // Conditional database configuration
    // For serverless, you should use a cloud database (Vercel Postgres, PlanetScale, etc.)
    // For local development, SQLite is used
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get("NODE_ENV") === "production";

        // In production/serverless, you should configure a cloud database
        // For now, we'll use in-memory SQLite for serverless (data won't persist)
        return {
          type: "sqlite",
          database: isProduction ? ":memory:" : "database.sqlite",
          entities: [Analysis],
          synchronize: true, // Set to false in production with migrations
          logging: !isProduction,
        };
      },
    }),
    AnalysisModule,
  ],
})
export class AppModule {}
