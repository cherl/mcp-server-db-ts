import * as mysql2Promise from 'mysql2/promise';
import { DatabaseAdapter, MySQLConfig, TableRow, ColumnRow } from '../types.js';

/**
 * MySQL数据库适配器实现
 */
export class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql2Promise.Pool | null = null;
  
  /**
   * 构造函数
   * @param config MySQL配置对象
   */
  constructor(private config: MySQLConfig) {}
  
  /**
   * 连接到MySQL数据库
   */
  async connect(): Promise<void> {
    if (this.pool) {
      return;
    }
    
    this.pool = mysql2Promise.createPool(this.config);
  }
  
  /**
   * 断开与MySQL数据库的连接
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
    
    const connection = await this.pool.getConnection();
    try {
      const result = await connection.query(sql, params);
      return (Array.isArray(result) ? result[0] : result) as T;
    } finally {
      connection.release();
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
    
    const connection = await this.pool.getConnection();
    
    try {
      // 设置只读模式
      await connection.query('SET SESSION TRANSACTION READ ONLY');
      
      // 开始事务
      await connection.beginTransaction();
      
      try {
        // 执行查询
        const result = await connection.query(sql);
        const rows = Array.isArray(result) ? result[0] : result;
        
        // 回滚事务(因为是只读的)
        await connection.rollback();
        
        // 重置为读写模式
        await connection.query('SET SESSION TRANSACTION READ WRITE');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rows, null, 2),
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 查询错误时回滚事务
        await connection.rollback();
        throw error;
      }
    } catch (error) {
      // 确保在任何错误发生时回滚并重置事务模式
      try {
        await connection.rollback();
        await connection.query('SET SESSION TRANSACTION READ WRITE');
      } catch {
        // 忽略清理过程中的错误
      }
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * 列出数据库中的所有表
   * @returns 表列表
   */
  async listTables(): Promise<TableRow[]> {
    const results = await this.executeQuery<any[]>(
      'SELECT table_name as TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE()'
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
      'SELECT column_name as COLUMN_NAME, data_type as DATA_TYPE FROM information_schema.columns WHERE table_name = ?',
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