#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config } from './config.js';
import { createDatabaseAdapter } from './adapters/index.js';
import { TableRow, ColumnRow } from './types.js';

// 获取表名的辅助函数
function getTableName(row: TableRow): string | undefined {
  return row.table_name || row.TABLE_NAME;
}

// 创建数据库适配器
const dbAdapter = createDatabaseAdapter(config);

// 创建MCP服务器
const server = new Server({
  name: config.server.name,
  version: config.server.version
}, {
  capabilities: {
    resources: {},
    tools: {},
  },
});

// 列出资源请求处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await dbAdapter.connect();
  
  try {
    const tables = await dbAdapter.listTables();
    
    return {
      resources: tables
        .filter(row => getTableName(row)) // 过滤掉没有表名的行
        .map((row: TableRow) => {
          const tableName = getTableName(row);
          return {
            uri: new URL(
              `${tableName}/${config.paths.schema}`,
              `${config.dbType}://${config.mysql.host}:${config.mysql.port}`
            ).href,
            mimeType: 'application/json',
            name: `"${tableName}" 数据库表结构`,
          };
        }),
    };
  } catch (error) {
    console.error('列出资源时出错:', error);
    throw error;
  }
});

// 读取资源请求处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  await dbAdapter.connect();
  
  try {
    const resourceUrl = new URL(request.params.uri);
    const pathComponents = resourceUrl.pathname.split('/');
    const schema = pathComponents.pop();
    const tableName = pathComponents.pop();
    
    if (schema !== config.paths.schema) {
      throw new Error('无效的资源URI');
    }
    
    const columns = await dbAdapter.getTableSchema(tableName as string);
    
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(columns, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('读取资源时出错:', error);
    throw error;
  }
});

// 列出工具请求处理器
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'db_query',
      description: `执行只读${config.dbType}数据库查询`,
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
        },
      },
    },
  ],
}));

// 调用工具请求处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'db_query') {
    throw new Error(`未知工具: ${request.params.name}`);
  }
  
  await dbAdapter.connect();
  
  try {
    const sql = request.params.arguments?.sql as string;
    return await dbAdapter.executeReadOnlyQuery(sql);
  } catch (error) {
    console.error('执行查询时出错:', error);
    return {
      content: [
        {
          type: 'text',
          text: `查询执行错误: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * 启动服务器
 */
async function runServer() {
  try {
    console.log(`启动 ${config.server.name} v${config.server.version}`);
    console.log(`数据库类型: ${config.dbType}`);
    
    // 连接到数据库
    await dbAdapter.connect();
    console.log('数据库连接成功');
    
    // 启动MCP服务器
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('服务器启动错误:', error);
    process.exit(1);
  }
}

/**
 * 正常关闭服务器
 * @param signal 信号名称
 */
const shutdown = async (signal: string) => {
  console.log(`接收到 ${signal} 信号, 正在关闭...`);
  
  try {
    await dbAdapter.disconnect();
    console.log('数据库连接已关闭');
  } catch (err) {
    console.error('关闭数据库连接时出错:', err);
    throw err;
  }
};

// 注册信号处理器
process.on('SIGINT', async () => {
  try {
    await shutdown('SIGINT');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await shutdown('SIGTERM');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

// 启动服务器
runServer().catch((error) => {
  console.error('服务器错误:', error);
  process.exit(1);
}); 