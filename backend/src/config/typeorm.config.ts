import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const getDataSourceOptions = (): DataSourceOptions => {
  const databaseUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  // If DATABASE_URL is provided (Render, Railway, etc.), use it
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
      logging: !isProduction,
    };
  }

  // Otherwise use individual env vars (local development)
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    logging: true,
  };
};

export default new DataSource(getDataSourceOptions());
