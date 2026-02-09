# 部署指南

本文档介绍如何将数据中心 2.5D 可视化项目部署到各种平台。

## 目录
- [构建准备](#构建准备)
- [Vercel 部署](#vercel-部署)
- [Netlify 部署](#netlify-部署)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [GitHub Pages 部署](#github-pages-部署)
- [自托管部署](#自托管部署)

## 构建准备

### 1. 环境检查
```bash
node --version  # 需要 >= 16
npm --version   # 需要 >= 7
```

### 2. 本地构建测试
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建成功后，`dist` 目录包含所有静态文件。

### 3. 构建优化配置

编辑 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，适用于所有部署环境
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境关闭 sourcemap
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'vendor-r3f': ['@react-three/fiber', '@react-three/drei']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

## Vercel 部署

### 方法 1: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 方法 2: 通过 Git 集成

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "Import Project"
4. 选择你的仓库
5. 配置构建设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. 点击 "Deploy"

### 环境变量（如需要）
```env
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://ws.example.com
```

## Netlify 部署

### 方法 1: 拖放部署

1. 运行 `npm run build`
2. 访问 [app.netlify.com](https://app.netlify.com)
3. 将 `dist` 文件夹拖放到部署区域

### 方法 2: 通过 Git 集成

1. 将代码推送到 Git 仓库
2. 在 Netlify 中点击 "New site from Git"
3. 选择仓库
4. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. 点击 "Deploy site"

### netlify.toml 配置

创建 `netlify.toml`：
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

## Cloudflare Pages 部署

### 通过 Wrangler CLI

```bash
# 安装 Wrangler
npm i -g wrangler

# 登录
wrangler login

# 构建
npm run build

# 部署
wrangler pages deploy dist --project-name=datacenter-viz
```

### 通过 Git 集成

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Pages" 部分
3. 点击 "Create a project"
4. 连接 Git 仓库
5. 配置构建：
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. 点击 "Save and Deploy"

### 性能优化

Cloudflare Pages 自动提供：
- 全球 CDN
- HTTP/3 支持
- 自动 Brotli 压缩
- 免费 SSL

## GitHub Pages 部署

### 1. 修改 vite.config.ts

```typescript
export default defineConfig({
  base: '/机房CFD/', // 替换为你的仓库名
  // ... 其他配置
});
```

### 2. 添加部署脚本

在 `package.json` 中添加：
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.0.0"
  }
}
```

### 3. 安装并部署

```bash
npm install --save-dev gh-pages
npm run deploy
```

### 4. 配置 GitHub 仓库

1. 进入仓库 Settings
2. 找到 "Pages" 部分
3. Source 选择 `gh-pages` 分支
4. 保存

访问 `https://[username].github.io/机房CFD/`

## 自托管部署

### 使用 Nginx

#### 1. 构建项目
```bash
npm run build
```

#### 2. Nginx 配置

创建 `/etc/nginx/sites-available/datacenter-viz`：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/datacenter-viz/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 3. 启用站点
```bash
sudo ln -s /etc/nginx/sites-available/datacenter-viz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 使用 Docker

#### Dockerfile
```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 构建和运行
```bash
# 构建镜像
docker build -t datacenter-viz .

# 运行容器
docker run -d -p 8080:80 --name datacenter-viz datacenter-viz

# 访问
open http://localhost:8080
```

### 使用 Docker Compose

#### docker-compose.yml
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

运行：
```bash
docker-compose up -d
```

## 性能优化建议

### 1. CDN 加速

使用 CDN 加速静态资源：
```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.gstatic.com">
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
```

### 2. 预加载关键资源

```html
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

### 3. 启用 HTTP/2

确保服务器支持 HTTP/2 以实现多路复用。

### 4. 监控和分析

使用工具监控性能：
- Google Analytics
- Sentry（错误追踪）
- Lighthouse（性能审计）

## 环境变量配置

创建 `.env.production`：
```env
VITE_API_URL=https://api.production.com
VITE_WS_URL=wss://ws.production.com
VITE_ENABLE_ANALYTICS=true
```

在代码中使用：
```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

## 故障排查

### 问题 1: 白屏
**原因**: 路径配置错误
**解决**: 检查 `vite.config.ts` 中的 `base` 配置

### 问题 2: 资源 404
**原因**: 相对路径问题
**解决**: 使用 `base: './'` 或正确的绝对路径

### 问题 3: WebGL 不工作
**原因**: 浏览器不支持或被禁用
**解决**: 添加降级提示

```tsx
// 检测 WebGL 支持
const checkWebGL = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  return !!gl;
};

if (!checkWebGL()) {
  alert('您的浏览器不支持 WebGL，无法显示 3D 内容');
}
```

## 持续集成/持续部署 (CI/CD)

### GitHub Actions 示例

创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 安全建议

1. **启用 HTTPS**: 所有生产环境必须使用 HTTPS
2. **设置 CSP**: 内容安全策略
3. **定期更新依赖**: `npm audit fix`
4. **环境变量保护**: 不要提交敏感信息到 Git

## 监控和维护

### 性能监控
- 使用 Lighthouse CI
- 设置性能预算
- 监控 Core Web Vitals

### 错误追踪
```typescript
// 集成 Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-dsn",
  environment: import.meta.env.MODE,
});
```

## 总结

选择部署平台建议：
- **快速原型**: Vercel / Netlify（免费，自动 CI/CD）
- **中国用户**: Cloudflare Pages（全球 CDN，中国友好）
- **企业级**: 自托管（完全控制，可定制）
- **开源项目**: GitHub Pages（免费，与代码同步）

所有平台都支持自动部署，选择最适合你需求的即可！
