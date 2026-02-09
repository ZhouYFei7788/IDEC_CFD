#!/bin/bash

# 间接蒸发冷仿真计算平台 - Cloudflare Pages 部署脚本
# 适合中国用户，访问速度快

set -e

echo "🚀 间接蒸发冷仿真计算平台 - 部署脚本"
echo "======================================="
echo ""

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📥 安装 Wrangler CLI..."
    npm install -g wrangler
    echo "✅ Wrangler 安装完成"
    echo ""
fi

# 检查是否已登录
echo "🔐 检查登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "需要登录 Cloudflare"
    echo "浏览器将打开，请完成登录..."
    wrangler login
else
    echo "✅ 已登录 Cloudflare"
fi

echo ""
echo "🔨 构建项目..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ 构建失败：找不到 dist 目录"
    exit 1
fi

echo "✅ 构建完成"
echo ""

# 询问项目名称
read -p "请输入项目名称 (默认: iec-simulation): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-iec-simulation}

echo ""
echo "🚀 开始部署到 Cloudflare Pages..."
echo "项目名称: $PROJECT_NAME"
echo ""

# 部署
wrangler pages deploy dist --project-name="$PROJECT_NAME"

echo ""
echo "🎉 部署完成！"
echo ""
echo "你的网站将在以下地址访问："
echo "https://$PROJECT_NAME.pages.dev"
echo ""
echo "💡 提示："
echo "  - 每次 git push 后可以自动部署"
echo "  - 可以在 Cloudflare Dashboard 绑定自定义域名"
echo "  - 访问 https://dash.cloudflare.com 管理你的项目"
echo ""
