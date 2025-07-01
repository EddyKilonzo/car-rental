import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create app with balanced logging - keep useful info but reduce noise
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Keep errors, warnings, and general logs
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Car Rental API')
    .setDescription('The Car Rental Management System API')
    .setVersion('1.0')
    .addTag('authentication', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('agents', 'Agent management')
    .addTag('vehicles', 'Vehicle operations')
    .addTag('bookings', 'Booking management')
    .addTag('reviews', 'Review system')
    .addTag('admin', 'Admin operations')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  // Clean startup message
  console.log(`🚀 Car Rental API running on port ${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
}
bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
