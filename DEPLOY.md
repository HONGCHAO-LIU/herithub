# herithub.org 公网部署流程

> 最后验证成功：2026-06-08

## 一、前置条件

1. Vercel 项目配置（通过 API 确保）：
   - `framework`: `nextjs`
   - `buildCommand`: `npm run build`
   - `installCommand`: `npm install`

2. `package.json` 中确保有 `prebuild` 钩子：
   ```json
   "scripts": {
     "prebuild": "node scripts/generate_last_update.cjs",
     "build": "next build"
   }
   ```

3. Vercel API Token（当前使用）：
   ```
   <从 Vercel Dashboard → Settings → Tokens 获取，部署时通过 --token 参数传入>
   ```

## 二、部署步骤

### Step 1：更新数据并本地验证

```powershell
# 修改 src/data/ 下的数据文件后，本地构建验证
npm run build
# 确认无报错，确认 prebuild 输出了正确的时间戳
```

### Step 2：提交并推送到 GitHub

```powershell
git add .
git commit -m "描述本次更新内容"
git push origin master
```

### Step 3：通过 Vercel CLI 直接部署到生产环境

```powershell
npx vercel --prod --token <YOUR_VERCEL_TOKEN>
```

部署后等待 3-5 分钟构建完成。

### Step 4：验证

```powershell
# 确认首页可访问
Invoke-WebRequest https://herithub.org -UseBasicParsing

# 确认时间戳已更新
Invoke-WebRequest https://herithub.org/last-update.json -UseBasicParsing
```

## 三、关键要点

| 要点 | 说明 |
|------|------|
| 必须用 `--prod` | 预览部署不会绑定自定义域名 |
| 必须用 `--token` | 当前环境 Vercel CLI 无本地凭据，必须显式传 token |
| framework 必须是 `nextjs` | 设为 `null` 会导致 Vercel 无法正确处理 Next.js 输出，页面 404 |
| buildCommand 必须是 `npm run build` | 确保 `prebuild` 钩子执行，生成正确的 `last-update.json` |
| prebuild 钩子不可省略 | 这是生成页面底部时间戳的唯一途径 |
