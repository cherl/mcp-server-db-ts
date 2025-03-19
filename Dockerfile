FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装cnpm
RUN npm install -g cnpm --registry=https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN cnpm install

# 复制源代码
COPY . .

# 编译TypeScript
RUN cnpm run build

# 设置权限
RUN chmod +x dist/index.js

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口（如果需要）
# EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"] 