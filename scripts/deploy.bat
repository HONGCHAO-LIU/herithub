@echo off
REM ===========================================
REM 部署脚本 (deploy.bat)
REM ===========================================
REM 用途: 检查 Git 仓库状态，执行 add/commit/push，
REM       触发 Vercel 自动部署。
REM
REM 前置条件:
REM   - Git 已安装并配置
REM   - 远程仓库已设置 (origin)
REM   - Vercel 已关联 GitHub/GitLab 仓库并启用自动部署
REM
REM 用法: deploy.bat [commit_message]
REM ===========================================

setlocal enabledelayedexpansion

REM 设置项目根目录
set "PROJECT_DIR=C:\Users\Administrator\Favorites\workspace-work\versions\v1.3.3"
cd /d "%PROJECT_DIR%" || (
    echo [ERROR] 无法进入项目目录: %PROJECT_DIR%
    exit /b 1
)

REM 设置提交信息（默认使用时间戳）
if "%~1"=="" (
    for /f "tokens=1-6 delims=/: " %%a in ('echo %date% %time%') do (
        set "TS=%%a-%%b-%%c_%%d:%%e:%%f"
    )
    set "COMMIT_MSG=Auto deploy: !TS!"
) else (
    set "COMMIT_MSG=%~1"
)

echo ============================================
echo  智汇遗藏 - 部署脚本
echo  时间: %date% %time%
echo  项目: %PROJECT_DIR%
echo  提交信息: !COMMIT_MSG!
echo ============================================

REM 步骤1: 检查 Git 状态
echo.
echo [1/4] 检查 Git 仓库状态...
git status --short > nul 2>&1
if errorlevel 1 (
    echo [ERROR] 不是有效的 Git 仓库或 Git 未安装
    exit /b 1
)

echo 当前分支:
git branch --show-current

echo.
echo 未暂存的变更:
git status --short

REM 检查是否有变更
git diff --quiet && git diff --cached --quiet
if errorlevel 1 (
    echo 检测到变更，继续部署...
) else (
    echo.
    echo [INFO] 没有检测到变更，跳过部署。
    exit /b 0
)

REM 步骤2: 添加变更
echo.
echo [2/4] 添加所有变更...
git add -A
if errorlevel 1 (
    echo [ERROR] git add 失败
    exit /b 1
)
echo 完成。

REM 步骤3: 提交
echo.
echo [3/4] 提交变更...
git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [WARN] git commit 没有新内容或失败（可能无变更）
)

REM 步骤4: 推送
echo.
echo [4/4] 推送到远程仓库...
git push origin HEAD
if errorlevel 1 (
    echo [ERROR] git push 失败，请检查网络或远程仓库配置
    exit /b 1
)

echo.
echo ============================================
echo  部署完成!
echo.
echo  变更已推送至远程仓库。
echo  Vercel 将自动检测到推送并触发部署。
echo  可在 Vercel Dashboard 查看部署状态:
echo    https://vercel.com/dashboard
echo ============================================

endlocal
exit /b 0
