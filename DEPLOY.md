# 部署 Web 版（Docker / Cloudflare Pages）

LabelAll **没有后端**：桌面端是 Tauri 应用，Web 版就是一份纯静态文件（`pnpm build` 产出到 `dist/`）。
所以「部署」本质上就是把 `dist/` 交给任意静态托管——下面两种方式二选一即可。

> Web 版依赖浏览器的 File System Access API：**Chrome / Edge 可读写，Firefox / Safari 只读**。
> 除 `localhost` 外需要 **HTTPS** 才能弹出目录选择框。

## 方式一：Docker（自建 / 内网）

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# 或者
docker compose up -d --build
```

然后打开 <http://localhost:8080>。镜像分两段：Node 构建 → nginx 托管（`deploy/nginx.conf` 已配好
SPA 回退和静态资源长缓存）。

> Docker 只在你想自己托管或内网分发时才有意义。它**不包含桌面端**，也不提供任何后端能力，
> 因为项目本身没有服务端。

## 方式二：Cloudflare Pages（公网，推荐）

仓库已带 `.github/workflows/deploy-cloudflare.yml`，推送到 `main` 即自动构建并发布。

1. 在 Cloudflare 控制台 **Workers & Pages → Create → Pages** 建一个项目，名字用 `labelall`
   （或改 workflow 里的 `--project-name`）。
2. 生成 API Token：**My Profile → API Tokens → Create Token**，权限至少包含
   `Cloudflare Pages: Edit`；同时记下 **Account ID**（控制台首页右侧可见）。
3. 在仓库 **Settings → Secrets and variables → Actions** 新建两个 secret：

   | Secret | 内容 |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | 上一步生成的 Token |
   | `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID |

4. push 到 `main`（或在 Actions 里手动触发），完成后在 Pages 面板即可看到访问地址。

自定义域名在 Pages 项目的 **Custom domains** 里绑定，Cloudflare 会自动签发 HTTPS 证书。

## 对比

| 方式 | 适合 | 备注 |
| --- | --- | --- |
| **Cloudflare Pages** | 公网访问 | 免费额度充足、自动 HTTPS，最省事 |
| **Docker** | 内网 / 自建服务器 | 只是静态托管，无后端 |
| **GitHub Pages** | 仓库 Pages 未被占用时 | 需要 `VITE_BASE=/<repo>/`；本项目已移除该配置，如需可加回 |
