#!/usr/bin/env node

/**
 * 设置环境文件
 * 如果 .env 文件不存在，则从 .env.example 创建
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function main() {
  const envPath = path.join(rootDir, '.env');
  const exampleEnvPath = path.join(rootDir, '.env.example');
  
  try {
    // 检查 .env 文件是否存在
    try {
      await fs.access(envPath);
      console.log('.env 文件已存在，跳过创建');
      return;
    } catch (error) {
      // .env 文件不存在，从 .env.example 创建
      console.log('.env 文件不存在，正在从 .env.example 创建...');
      
      // 读取 .env.example 文件
      const exampleEnvContent = await fs.readFile(exampleEnvPath, 'utf8');
      
      // 写入 .env 文件
      await fs.writeFile(envPath, exampleEnvContent);
      
      console.log('.env 文件已成功创建！');
    }
  } catch (error) {
    console.error('设置环境文件时出错:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('运行脚本时出错:', error);
  process.exit(1);
}); 