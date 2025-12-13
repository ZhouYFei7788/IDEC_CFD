# 🇨🇳 中国部署方案指南

针对中国用户优化的部署方案，访问速度快，无需翻墙。

## 🚀 推荐方案（按优先级排序）

---

## 方案 1️⃣：Cloudflare Pages（最推荐）

### 优点
- ✅ 完全免费
- ✅ 中国访问速度快
- ✅ 自动 HTTPS
- ✅ 无限带宽
- ✅ Git 集成自动部署

### 部署步骤

#### 方法 A：通过网页界面（最简单）

1. **访问** https://pages.cloudflare.com

2. **注册/登录** Cloudflare 账号

3. **连接 Git 仓库**
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 授权 GitHub/GitLab

4. **配置构建设置**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`

5. **点击 "Save and Deploy"**

6. **完成！** 获得类似 `https://my-hvac.pages.dev` 的网址

#### 方法 B：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
npm run build
wrangler pages deploy dist --project-name=hvac-simulator
```

---

## 方案 2️⃣：腾讯云 Webify（国内服务）

### 优点
- ✅ 腾讯云官方服务
- ✅ 国内访问极快
- ✅ 免费额度充足
- ✅ 支持自定义域名（需备案）

### 部署步骤

1. **访问** https://console.cloud.tencent.com/webify

2. **新建应用**
   - 选择 "从代码仓库导入"
   - 连接 GitHub/Gitee

3. **配置构建**
   - 构建命令: `npm run build`
   - 输出目录: `dist`

4. **部署完成**

---

## 方案 3️⃣：阿里云 OSS + CDN

### 优点
- ✅ 国内访问速度最快
- ✅ 价格便宜（几块钱/月）
- ✅ 稳定可靠

### 部署步骤

1. **构建项目**
   ```bash
   npm run build
   ```

2. **开通阿里云 OSS**
   - 访问 https://oss.console.aliyun.com
   - 创建 Bucket（选择公共读）

3. **上传文件**
   - 将 `dist` 文件夹内容上传到 OSS
   - 或使用 ossutil 工具批量上传

4. **配置静态网站**
   - 在 Bucket 设置中启用"静态网站托管"
   - 默认首页: `index.html`
   - 默认 404 页: `index.html`

5. **绑定 CDN（可选）**
   - 加速访问速度
   - 降低流量费用

---

## 方案 4️⃣：Gitee Pages（完全免费）

### 优点
- ✅ 完全免费
- ✅ 国内访问快
- ✅ 简单易用

### 限制
- ⚠️ 需要实名认证
- ⚠️ 每次更新需要手动点击"更新"

### 部署步骤

1. **将代码推送到 Gitee**
   ```bash
   git remote add gitee https://gitee.com/你的用户名/my-hvac.git
   git push gitee main
   ```

2. **开启 Gitee Pages**
   - 进入仓库页面
   - 点击 "服务" → "Gitee Pages"
   - 选择分支: `main`
   - 部署目录: 留空或选择 `dist`（需先构建）

3. **构建并更新**
   ```bash
   npm run build
   git add dist -f
   git commit -m "Build for deployment"
   git push gitee main
   ```

4. **访问网站**
   - 地址: `https://你的用户名.gitee.io/my-hvac`

---

## 方案 5️⃣：华为云 CloudIDE + Pages

### 优点
- ✅ 国内服务
- ✅ 免费额度
- ✅ 集成开发环境

### 部署步骤

1. 访问 https://www.huaweicloud.com/product/cloudide.html
2. 创建工作空间
3. 导入代码
4. 使用内置部署功能

---

## 方案 6️⃣：自己的服务器（完全控制）

### 适用于：有自己的云服务器（阿里云/腾讯云/华为云等）

### 部署步骤

#### 使用 Nginx

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传到服务器**
   ```bash
   scp -r dist/* root@你的服务器IP:/var/www/hvac
   ```

3. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/hvac;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **重启 Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

#### 使用 Docker

```bash
# 构建镜像
docker build -t hvac-simulator .

# 运行容器
docker run -d -p 80:80 hvac-simulator
```

---

## 📊 方案对比

| 方案 | 速度 | 费用 | 难度 | 推荐度 |
|------|------|------|------|--------|
| Cloudflare Pages | ⭐⭐⭐⭐ | 免费 | ⭐ | ⭐⭐⭐⭐⭐ |
| 腾讯云 Webify | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 阿里云 OSS | ⭐⭐⭐⭐⭐ | 低 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Gitee Pages | ⭐⭐⭐⭐ | 免费 | ⭐⭐ | ⭐⭐⭐ |
| 华为云 | ⭐⭐⭐⭐ | 免费 | ⭐⭐ | ⭐⭐⭐ |
| 自建服务器 | ⭐⭐⭐⭐⭐ | 中 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 快速开始建议

### 如果你想要最快部署：
👉 使用 **Cloudflare Pages 网页界面**

### 如果你想要国内最快速度：
👉 使用 **腾讯云 Webify** 或 **阿里云 OSS**

### 如果你想要完全免费：
👉 使用 **Cloudflare Pages** 或 **Gitee Pages**

---

## 🔧 通用构建命令

无论选择哪个平台，构建配置都是一样的：

```bash
# 构建命令
npm run build

# 输出目录
dist

# Node 版本
20
```

---

## 📝 下一步

1. **选择一个方案**（推荐 Cloudflare Pages）
2. **按照步骤操作**
3. **获得部署 URL**
4. **分享给其他人！**

---

需要帮助？告诉我你选择哪个方案，我可以提供详细指导！
