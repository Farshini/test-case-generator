import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { RequirementsModule } from './requirements/requirements.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { AiModule } from './ai/ai.module';
import { Requirement } from './requirements/entities/requirement.entity';
import { TestCase } from './test-cases/entities/test-case.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [Requirement, TestCase],
        // Fine for an assessment/dev environment; a real deployment would
        // use migrations instead of sync.
        synchronize: true,
      }),
    }),
    RequirementsModule,
    TestCasesModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
