#!/bin/bash

# HVAC 模拟器快速部署脚本
# 使用方法: ./deploy.sh [vercel|netlify|docker]

set -e

echo "🚀 HVAC 模拟器部署脚本"
echo "======================="
echo ""

# 检查参数
if [ $# -eq 0 ]; then
    echo "请选择部署方式："
    echo "  1) Vercel (推荐)"
    echo "  2) Netlify"
    echo "  3) Docker"
    echo "  4) 仅构建"
    echo ""
    read -p "请输入选项 (1-4): " choice
    
    case $choice in
        1) DEPLOY_TYPE="vercel" ;;
        2) DEPLOY_TYPE="netlify" ;;
        3) DEPLOY_TYPE="docker" ;;
        4) DEPLOY_TYPE="build" ;;
        *) echo "❌ 无效选项"; exit 1 ;;
    esac
else
    DEPLOY_TYPE=$1
fi

echo ""
echo "📦 开始部署流程: $DEPLOY_TYPE"
echo ""

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：构建项目
build_project() {
    echo "🔨 构建项目..."
    npm run build
    echo "✅ 构建完成！"
}

# Vercel 部署
deploy_vercel() {
    if ! command_exists vercel; then
        echo "📥 安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🚀 部署到 Vercel..."
    vercel --prod
    echo "✅ Vercel 部署完成！"
}

# Netlify 部署
deploy_netlify() {
    if ! command_exists netlify; then
        echo "📥 安装 Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    build_project
    
    echo "🚀 部署到 Netlify..."
    netlify deploy --prod --dir=dist
    echo "✅ Netlify 部署完成！"
}

# Docker 部署
deploy_docker() {
    if ! command_exists docker; then
        echo "❌ 错误: 未安装 Docker"
        echo "请访问 https://www.docker.com/get-started 安装 Docker"
        exit 1
    fi
    
    echo "🐳 构建 Docker 镜像..."
    docker build -t hvac-simulator .
    
    echo "🚀 启动 Docker 容器..."
    docker stop hvac-simulator 2>/dev/null || true
    docker rm hvac-simulator 2>/dev/null || true
    docker run -d -p 80:80 --name hvac-simulator hvac-simulator
    
    echo "✅ Docker 部署完成！"
    echo "📍 访问 http://localhost 查看应用"
}

# 执行部署
case $DEPLOY_TYPE in
    vercel)
        deploy_vercel
        ;;
    netlify)
        deploy_netlify
        ;;
    docker)
        deploy_docker
        ;;
    build)
        build_project
        echo "📂 构建文件位于 dist/ 目录"
        ;;
    *)
        echo "❌ 未知的部署类型: $DEPLOY_TYPE"
        echo "支持的类型: vercel, netlify, docker, build"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署流程完成！"
