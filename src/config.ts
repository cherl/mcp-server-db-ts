import * as dotenv from 'dotenv';
import { AppConfig } from './types.js';

// 加载.env文件中的环境变量
dotenv.config();

/**
 * 从环境变量中获取配置信息
 * @returns 应用配置对象
 */
function loadConfig(): AppConfig {
  const dbType = (process.env.DB_TYPE || 'mysql') as 'mysql' | 'postgres';
  
  return {
    server: {
      name: process.env.SERVER_NAME || 'mcp-server-db-ts',
      version: process.env.SERVER_VERSION || '1.0.0',
    },
    dbType,
    mysql: {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASS || '',
      database: process.env.MYSQL_DB || '',
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || '10'),
      authPlugins: {
        mysql_clear_password: () => () => Buffer.from(process.env.MYSQL_PASS || '')
      }
    },
    postgres: {
      host: process.env.PG_HOST || '127.0.0.1',
      port: Number(process.env.PG_PORT || '5432'),
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASS || '',
      database: process.env.PG_DB || '',
      connectionLimit: Number(process.env.PG_CONNECTION_LIMIT || '10'),
      ssl: process.env.PG_SSL === 'true'
    },
    paths: {
      schema: 'schema',
    },
  };
}

// 导出配置对象
export const config = loadConfig(); 