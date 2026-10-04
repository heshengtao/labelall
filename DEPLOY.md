# 部署 Web 版（Docker / Docker Hub）

LabelAll **没有后端**：桌面端是 Tauri 应用，Web 版就是一份纯静态文件（`pnpm build` 产出到 `dist/`）。
所以「部署」本质上就是把 `dist/` 交给任意静态托管——下面的方式按需选择即可。

> Web 版依赖浏览器的 File System Access API：**Chrome / Edge 可读写，Firefox / Safari 只读**。
> 除 `localhost` 外需要 **HTTPS** 才能弹出目录选择框。

## 方式一：本地 / 内网用 Docker

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

## 方式二：发布到 Docker Hub（打 tag 自动构建）

仓库带 `.github/workflows/release-docker.yml`：**打版本 tag 时**自动构建 `linux/amd64` 与
`linux/arm64` 两个架构，合并成一个多架构 manifest 推送到 Docker Hub，并打上语义化版本标签和
`latest`。

1. 到 **Docker Hub → Account settings → Security → New Access Token** 新建一个 token，
   权限选 **Read & Write**，复制出来（只显示一次）。
2. 在仓库 **Settings → Secrets and variables → Actions** 新建一个 secret：

   | Secret | 内容 |
   | --- | --- |
   | `DOCKERHUB_TOKEN` | 上一步的 token |

   > Docker Hub 的用户名不用建 secret，它写在 workflow 里（`DOCKERHUB_USERNAME`，当前是
   > `ailm32442`）。要换成别的账号，同时改 `DOCKERHUB_USERNAME` 和 `IMAGE` 即可。

3. 打 tag 即自动发布：

   ```bash
   git tag v0.1.3 && git push origin v0.1.3
   ```

   之后任何人可以：

   ```bash
   docker run --rm -p 8080:80 ailm32442/labelall:latest
   ```

> 没有配置 `DOCKERHUB_TOKEN` 时，这个 workflow 会**跳过推送并静默成功**，不会让 tag 构建失败。

## 方式三：部署演示站到 Cloudflare Pages

演示站 <https://labelall.superagentparty.com/> 由 Cloudflare Pages 的 `labelall` 项目托管。

> ⚠️ 这个项目**没有连接 Git**（`npx wrangler pages project list` 里 Git Provider 显示为 `No`），
> 所以 **`git push` 不会触发部署**，必须手动执行下面的命令。

第一次使用先登录一次（浏览器 OAuth，账号需有 `Pages: Edit` 权限）：

```bash
npx wrangler login
```

之后每次发布：

```bash
pnpm build
npx wrangler pages deploy dist --project-name=labelall --branch=main --commit-dirty=true
```

- `--branch=main` 与项目的生产分支一致，因此发布到生产域名；命令结束时会打印一个
  `https://<hash>.labelall.pages.dev` 的预览地址。
- `--commit-dirty=true` 跳过「工作区有未提交改动」的确认提示（`dist/` 本身在 `.gitignore` 里）。
- 部署完用真实域名复核一下新包是否生效：

  ```bash
  curl -s https://labelall.superagentparty.com/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
  ```

换成别的账号或项目时，只要改 `--project-name` 即可。

## 其它托管方式

| 方式 | 适合 | 备注 |
| --- | --- | --- |
| **Docker Hub + Docker** | 自建 / 内网 / 想要镜像 | 见上；镜像只是静态托管 |
| **Cloudflare Pages / Netlify / Vercel** | 公网访问 | 直接部署 `dist/`，自动 HTTPS；本项目的演示站见上文「方式三」 |
| **GitHub Pages** | 仓库 Pages 未被占用时 | 需要 `VITE_BASE=/<repo>/`；本项目已移除该配置，如需可加回 |

> 无论哪种方式，公网访问都必须是 HTTPS，否则浏览器不会允许打开本地文件夹。

## 演示站的合规提示

公开演示站（`labelall.superagentparty.com`）会显示一条存储提示横幅，并提供
**隐私政策**（`#/privacy`）与**用户协议**（`#/terms`）页面。它只是说明性的：应用本身不写
Cookie，也绝不上传数据集。关掉横幅后，仍可从**设置**里重新打开这两个页面。

自托管部署默认**不显示**。如果你也想在自己的站点上打开，构建时设置环境变量即可：

```bash
VITE_FORCE_LEGAL=1 pnpm build
```

想把提示固定到另一个域名（而不是靠环境变量），改
`src/platform/demoSite.ts` 里的 `DEMO_HOSTNAMES` 即可。
