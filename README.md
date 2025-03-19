# MCP 数据库服务器 (TypeScript)

这是一个基于 Model Context Protocol (MCP) 的数据库查询服务器，用 TypeScript 实现。它允许 AI 模型安全地查询关系型数据库，如 MySQL 和 PostgreSQL。

## 功能特性

- 支持 MySQL 和 PostgreSQL 数据库
- 提供表结构信息作为资源
- 支持只读 SQL 查询执行
- 使用事务确保查询安全性

## 安装

使用 cnpm 进行安装:

```bash
git clone <repository-url>
cd mcp-server-db-ts
cnpm install
```

## 配置

1. 复制 `.env.example` 文件为 `.env`:

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置您的数据库连接信息:

```
# 数据库连接配置
# 数据库类型: mysql 或 postgres
DB_TYPE=mysql

# MySQL 配置
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASS=your_password
MYSQL_DB=your_database

# PostgreSQL 配置
PG_HOST=127.0.0.1
PG_PORT=5432
PG_USER=postgres
PG_PASS=your_password
PG_DB=your_database

# 服务器配置
SERVER_NAME=mcp-server-db-ts
SERVER_VERSION=1.0.0
```

## 构建

```bash
cnpm run build
```

## 运行

```bash
cnpm start
```

## 开发模式

```bash
cnpm run dev
```

## 支持的 MCP 功能

### 资源

- `list_resources`: 列出数据库中的所有表
- `read_resource`: 获取指定表的结构信息

### 工具

- `db_query`: 执行只读 SQL 查询

## 使用示例

1. 列出所有表:
   - MCP 请求: `list_resources`
   - 响应: 以 URI 形式返回所有表的列表

2. 获取表结构:
   - MCP 请求: `read_resource` 使用特定表的 URI
   - 响应: 返回表的列信息

3. 执行查询:
   - MCP 请求: `call_tool` 使用 `db_query` 工具和 SQL 查询
   - 响应: 返回查询结果

## 许可证

MIT 