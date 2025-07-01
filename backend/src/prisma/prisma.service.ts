import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static isConnected = false;

  constructor() {
    // Configure logging based on environment and custom settings
    const logLevels = PrismaService.getLogLevels();
    
    super({
      log: logLevels,
    });
  }

  private static getLogLevels(): Array<'query' | 'info' | 'warn' | 'error'> {
    // Check for custom PRISMA_LOG environment variable
    if (process.env.PRISMA_LOG) {
      return process.env.PRISMA_LOG.split(',') as Array<'query' | 'info' | 'warn' | 'error'>;
    }
    
    // Default behavior: keep info logs for connections, but no query logs
    return ['info', 'warn', 'error'];
  }

  async onModuleInit() {
    try {
      if (!PrismaService.isConnected) {
        await this.$connect();
        PrismaService.isConnected = true;
        this.logger.log('Database connected successfully');
      }
    } catch (error) {
      console.error(error);
      this.logger.error('Error connecting to database', error);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    PrismaService.isConnected = false;
    this.logger.log('Database disconnected successfully');
  }
}
