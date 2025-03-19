#!/usr/bin/env node

/**
 * 测试脚本：用于测试数据库连接和查询
 * 不需要MCP协议，直接测试数据库适配器
 */

import { config } from './config.js';
import { createDatabaseAdapter } from './adapters/index.js';

async function main() {
  console.log('测试数据库连接和查询...');
  console.log(`数据库类型: ${config.dbType}`);
  
  const dbAdapter = createDatabaseAdapter(config);
  
  try {
    // 连接到数据库
    console.log('正在连接到数据库...');
    await dbAdapter.connect();
    console.log('数据库连接成功！');
    
    // 列出所有表
    console.log('\n获取所有表:');
    const tables = await dbAdapter.listTables();
    console.log(tables);
    
    if (tables.length > 0) {
      // 获取第一个表的表名
      const firstTableObj = tables[0];
      // 处理可能出现的表名格式不同的情况
      const firstTable = firstTableObj.table_name || firstTableObj.TABLE_NAME;
      
      if (firstTable) {
        console.log(`\n获取表 ${firstTable} 的结构:`);
        const schema = await dbAdapter.getTableSchema(firstTable);
        console.log(schema);
        
        // 执行简单查询
        console.log(`\n从表 ${firstTable} 中查询数据 (限制10行):`);
        const query = `SELECT * FROM ${firstTable} LIMIT 10`;
        console.log(`执行查询: ${query}`);
        
        const result = await dbAdapter.executeReadOnlyQuery(query);
        console.log('查询结果:');
        console.log(result);
      } else {
        console.log('无法识别表名格式');
      }
    } else {
      console.log('数据库中没有表！');
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 断开数据库连接
    console.log('\n正在断开数据库连接...');
    await dbAdapter.disconnect();
    console.log('数据库连接已关闭');
  }
}

main().catch(error => {
  console.error('运行测试时出错:', error);
  process.exit(1);
}); 