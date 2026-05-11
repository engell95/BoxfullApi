import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import 'winston-mongodb';
import * as dotenv from 'dotenv';

// Cargar variables de entorno manualmente porque el logger arranca antes que NestJS
dotenv.config();

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ms, context }) => {
          return `${timestamp} [${level}] ${context ? '[' + context + '] ' : ''}${message} ${ms}`;
        }),
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Transport para enviar logs directamente a MongoDB
    ...(process.env.DATABASE_URL
      ? [
          new winston.transports.MongoDB({
            level: 'error', // Guardar solo errores en DB para no saturar
            db: process.env.DATABASE_URL,
            options: { useUnifiedTopology: true },
            collection: 'system_logs', // Crea una colección llamada 'system_logs'
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            ),
          }),
        ]
      : []),
  ],
};
