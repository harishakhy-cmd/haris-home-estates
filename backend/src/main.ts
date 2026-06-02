import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security and CORS
  app.use(helmet());
  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({ origin: corsOrigin?.split(',') ?? true, credentials: true });
  
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  // Graceful degradation checks
  if (!config.get('REDIS_URL')) {
    logger.warn('REDIS_URL is missing. Redis caching is gracefully disabled.');
  }
  if (!config.get('TYPESENSE_HOST') || !config.get('TYPESENSE_API_KEY')) {
    logger.warn('Typesense configuration is absent. Search features are disabled.');
  }
  if (!config.get('CLOUDINARY_CLOUD_NAME') || !config.get('CLOUDINARY_API_KEY') || !config.get('CLOUDINARY_API_SECRET')) {
    logger.warn('Cloudinary credentials not provided. Skipping Cloudinary initialization.');
  }

  // Swagger Documentation
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('HARIS API')
      .setDescription('Housing And Rental Intelligent System REST API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api', app, document);

  // Port Configuration for Render Compatibility
  const port = process.env.PORT || config.get<number>('PORT') || 3001;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
