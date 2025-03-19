/**
 * 数据库连接配置接口
 */
export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

/**
 * MySQL特定配置接口
 */
export interface MySQLConfig extends DbConfig {
  authPlugins?: {
    [key: string]: () => () => Buffer;
  };
}

/**
 * PostgreSQL特定配置接口
 */
export interface PostgresConfig extends DbConfig {
  ssl?: boolean | object;
}

/**
 * 服务器配置接口
 */
export interface ServerConfig {
  name: string;
  version: string;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  server: ServerConfig;
  dbType: 'mysql' | 'postgres';
  mysql: MySQLConfig;
  postgres: PostgresConfig;
  paths: {
    schema: string;
  };
}

/**
 * 表行数据接口
 */
export interface TableRow {
  table_name?: string;
  TABLE_NAME?: string;
  [key: string]: any; // 允许其他可能的表名格式
}

/**
 * 列数据接口
 */
export interface ColumnRow {
  column_name?: string;
  COLUMN_NAME?: string;
  data_type?: string;
  DATA_TYPE?: string;
  [key: string]: any; // 允许其他可能的列名格式
}

/**
 * 数据库查询接口
 */
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery<T>(sql: string, params?: any[]): Promise<T>;
  executeReadOnlyQuery(sql: string): Promise<any>;
  listTables(): Promise<TableRow[]>;
  getTableSchema(tableName: string): Promise<ColumnRow[]>;
}