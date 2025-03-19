import { AppConfig, DatabaseAdapter } from '../types.js';
import { MySQLAdapter } from './mysql-adapter.js';
import { PostgresAdapter } from './postgres-adapter.js';

/**
 * 创建数据库适配器
 * @param config 应用配置
 * @returns 数据库适配器实例
 */
export function createDatabaseAdapter(config: AppConfig): DatabaseAdapter {
  switch (config.dbType) {
    case 'mysql':
      return new MySQLAdapter(config.mysql);
    case 'postgres':
      return new PostgresAdapter(config.postgres);
    default:
      throw new Error(`不支持的数据库类型: ${config.dbType}`);
  }
} 