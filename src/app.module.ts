import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { Analysis } from './modules/analysis/entities/analysis.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Analysis],
      synchronize: true, // Auto-create tables (dev only)
    }),
    AnalysisModule,
  ],
})
export class AppModule {}
