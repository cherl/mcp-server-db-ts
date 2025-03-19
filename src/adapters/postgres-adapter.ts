import pkg from 'pg';
const { Pool } = pkg;
import { DatabaseAdapter, PostgresConfig, TableRow, ColumnRow } from '../types.js';

/**
 * PostgreSQL数据库适配器实现
 */
export class PostgresAdapter implements DatabaseAdapter {
  private pool: InstanceType<typeof Pool> | null = null;
  
  /**
   * 构造函数
   * @param config PostgreSQL配置对象
   */
  constructor(private config: PostgresConfig) {}
  
  /**
   * 连接到PostgreSQL数据库
   */
  async connect(): Promise<void> {
    if (this.pool) {
      return;
    }
    
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      max: this.config.connectionLimit,
      ssl: this.config.ssl
    });
  }
  
  /**
   * 断开与PostgreSQL数据库的连接
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }
    
    await this.pool.end();
    this.pool = null;
  }
  
  /**
   * 执行SQL查询
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  async executeQuery<T>(sql: string, params: any[] = []): Promise<T> {
    if (!this.pool) {
      throw new Error('数据库连接未初始化');
    }
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows as T;
    } finally {
      client.release();
    }
  }
  
  /**
   * 执行只读SQL查询
   * @param sql SQL查询语句
   * @returns 查询结果
   */
  async executeReadOnlyQuery(sql: string): Promise<any> {
    if (!this.pool) {
      throw new Error('数据库连接未初始化');
    }
    
    const client = await this.pool.connect();
    
    try {
      // 开始事务并设置为只读
      await client.query('BEGIN TRANSACTION READ ONLY');
      
      try {
        // 执行查询
        const result = await client.query(sql);
        
        // 回滚事务(因为是只读的)
        await client.query('ROLLBACK');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.rows, null, 2),
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 查询错误时回滚事务
        await client.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      // 确保在任何错误发生时回滚
      try {
        await client.query('ROLLBACK');
      } catch {
        // 忽略清理过程中的错误
      }
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * 列出数据库中的所有表
   * @returns 表列表
   */
  async listTables(): Promise<TableRow[]> {
    const results = await this.executeQuery<any[]>(
      `SELECT table_name as "TABLE_NAME" FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    
    // 确保结果的一致性
    return results.map(row => ({
      table_name: row.TABLE_NAME,
      TABLE_NAME: row.TABLE_NAME
    }));
  }
  
  /**
   * 获取表结构信息
   * @param tableName 表名
   * @returns 列信息列表
   */
  async getTableSchema(tableName: string): Promise<ColumnRow[]> {
    const results = await this.executeQuery<any[]>(
      `SELECT column_name as "COLUMN_NAME", data_type as "DATA_TYPE" FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName]
    );
    
    // 确保结果的一致性
    return results.map(row => ({
      column_name: row.COLUMN_NAME,
      COLUMN_NAME: row.COLUMN_NAME,
      data_type: row.DATA_TYPE,
      DATA_TYPE: row.DATA_TYPE
    }));
  }
} 