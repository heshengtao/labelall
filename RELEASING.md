# 发布与打包（RELEASING）

本文说明如何自动构建三平台安装包并发布版本，并回答一个常见问题：**macOS 版本需要私钥吗？**

## 一、打一个版本（不需要任何密钥）

1. 更新 `CHANGELOG.md`，把 `Unreleased` 里的内容整理到新版本号下。
2. 提交后打 tag 并推送：

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. 推送 tag 后，`.github/workflows/release.yml` 会自动在 macOS（Apple Silicon / Intel）、
   Windows、Linux 上分别构建安装包，并生成一个**草稿 Release**（草稿不会自动公开）。
4. 打开仓库的 **Releases** 页面，检查草稿里的安装包无误后点击 **Publish release**。

> 也可以在 Actions 页面手动触发该 workflow（workflow_dispatch）试跑，但手动触发没有 tag，
> 不会创建 Release。

## 二、本地打包（可选）

```bash
pnpm install
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/` 下。

> 因为开启了自动更新产物，本地打包也需要提供签名密钥，否则会报错：

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/labelall-updater.key)" pnpm tauri build
```

> 想在本机产出带 WebView2 运行时的 **Windows 离线版**（该配置关掉了自动更新产物，所以无需签名密钥）：

```bash
pnpm tauri build --config src-tauri/tauri.windows-offline.conf.json
```

## 三、macOS 需要「私有自签名 key」吗？

**不需要。** macOS 打包**不需要你生成任何自签名私钥**。只有三种情况，选一种即可：

### 1. 临时签名（ad-hoc）——默认方案，零成本

- 本项目（和你的 `ExamBot` 一样）在 `src-tauri/tauri.conf.json` 里设置了：

  ```json
  "bundle": { "macOS": { "signingIdentity": "-" } }
  ```

  `"-"` 表示**临时签名（ad-hoc）**，不需要任何证书或密钥。
- Apple Silicon（arm64）上的二进制**必须至少临时签名才能运行**，所以这项不要删除。
- 代价：安装包没有经过 Apple 公证，用户从网络下载后第一次打开会被 Gatekeeper 拦截，
  需要**右键 →「打开」**，或在终端执行一次：

  ```bash
  xattr -cr /Applications/LabelAll.app
  ```

  这句话已经写进 Release 说明和 README，用户照做即可。

### 2. 正式签名 + 公证——需要付费 Apple Developer 账号

想做到「双击就能打开、没有任何警告」，必须使用 **Apple 官方签发的 Developer ID 证书**并
做公证，这需要加入 **Apple Developer Program（约 99 美元/年）**。配置方式见第四节。

### 3. 自签名证书（self-signed）——对分发没用

Gatekeeper 只信任 Apple 签发的 Developer ID 证书。你自己用「钥匙串访问」生成的自签名证书，
**只在你手动导入并信任它的机器上有效**，别人下载后照样被拦，解决不了分发问题。
所以这条路不用考虑。

### 关于 `TAURI_SIGNING_PRIVATE_KEY`

你在 ExamBot 的 workflow 里看到的 `TAURI_SIGNING_PRIVATE_KEY`，**和 macOS 签名无关**：
它是 Tauri **应用内自动更新（updater）** 用的 minisign 密钥，用来给更新包签名与校验。

本项目现已启用自动更新，所以这个密钥**必须配置**（见第四节）；它替代不了 macOS 签名，
两件事互不影响。

## 四、自动更新（updater）—— 发布前必须配置一次

桌面版已接入 Tauri 自动更新：启动后会静默检查 GitHub Release 上的 `latest.json`，有新版就在应用内提示，一键下载安装并重启（设置面板里也有「检查更新」按钮）。

因为 `bundle.createUpdaterArtifacts` 已开启，**构建时需要更新签名密钥，否则 release 构建会直接失败**。所以发布前请先做两件事：

1. 在仓库 **Settings → Secrets and variables → Actions → New repository secret** 新建
   `TAURI_SIGNING_PRIVATE_KEY`，内容是私钥文件的全文。密钥本机已经生成好了：

   ```bash
   cat ~/.tauri/labelall-updater.key
   ```

   把输出的整段内容粘贴进 secret 即可。当前私钥**没有设密码**，所以
   `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 可以不建（若以后给私钥加了密码，则必须同时建这一项）。

2. 确认 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey` 与私钥配对 —— **已经帮你填好了**
   （对应 `~/.tauri/labelall-updater.key.pub`）。以后若重新生成密钥，记得同步更新这里。

配好之后，每次打 tag 的构建都会自动产出**签名过的更新包**和 `latest.json` 并附到 Release 上，已安装的旧版本就能检测并升级。

> 私钥务必保管好：一旦丢失就无法再签出可用的更新包，用户的自动更新会失败，只能手动重装。轮换密钥时重新
> `pnpm tauri signer generate -w <路径>`，然后同时更新 pubkey 和 secret。

## 五、可选：Apple Developer 正式签名与公证

需要 Apple Developer 账号、Developer ID Application 证书，以及一个 App 专用密码。

1. 在 Apple Developer 后台创建并下载 **Developer ID Application** 证书，导出为带密码的
   `.p12` 文件。
2. 转成 base64（macOS 上）：

   ```bash
   base64 -i DeveloperID.p12 | pbcopy
   ```

3. 到 appleid.apple.com 生成一个 **App 专用密码**（Apple ID 登录密码不能用）。
4. 在仓库 **Settings → Secrets and variables → Actions → New repository secret** 新建：

   | Secret | 内容 |
   | --- | --- |
   | `APPLE_CERTIFICATE` | 第 2 步的 base64 文本 |
   | `APPLE_CERTIFICATE_PASSWORD` | 导出 `.p12` 时设置的密码 |
   | `APPLE_SIGNING_IDENTITY` | 例如 `Developer ID Application: Your Name (TEAMID)` |
   | `APPLE_ID` | 你的 Apple ID 邮箱 |
   | `APPLE_PASSWORD` | 第 3 步的 App 专用密码 |
   | `APPLE_TEAM_ID` | Apple Developer 团队 ID（10 位） |

5. 在 `.github/workflows/release.yml` 的 `Build installers and draft the release` 步骤里，
   把 `env:` 补成：

   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
     APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
     APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
     APPLE_ID: ${{ secrets.APPLE_ID }}
     APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
     APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
   ```

   配好之后，macOS 安装包会自动签名并公证，用户双击即可打开；也就可以把 README 里的
   `xattr` 提示删掉。

## 六、可选：Windows 签名

不签名一样能用，只是会弹 SmartScreen 提示。要消除的话需要一张代码签名证书（`.pfx`）。

1. 转成 base64：

   ```bash
   openssl base64 -in cert.pfx -out cert.b64
   ```

2. 新建 secrets：

   | Secret | 内容 |
   | --- | --- |
   | `WINDOWS_CERTIFICATE` | `cert.b64` 的内容 |
   | `WINDOWS_CERTIFICATE_PASSWORD` | `.pfx` 的密码 |

3. 在 `release.yml` 的同一个 `env:` 里加上：

   ```yaml
   WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
   WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
   ```

### 两种 Windows 安装包（在线 / 离线）

Windows 端的界面依赖 **WebView2 运行时**，而它**不是** Windows 系统组件：Windows 11 自带，
Windows 10 常常没有。所以每次发布都会在 Release 上附**两个** Windows 安装包：

| 文件（`<版本>` 为实际版本号） | 说明 |
| --- | --- |
| `LabelAll_<版本>_x64-setup.exe` / `LabelAll_<版本>_x64_en-US.msi` | **在线版**（默认）：安装时联网到微软 CDN 下载 WebView2，体积小。**自动更新以它为准。** |
| `LabelAll_<版本>_x64-setup-offline.exe` / `LabelAll_<版本>_x64_en-US-offline.msi` | **离线版**：把完整 WebView2 运行时打进安装包（约 +130MB），**全程无需联网**，适合内网 / 气隙机器。 |

离线版由 `release.yml` 里独立的 `windows-offline` 任务构建：它用
`src-tauri/tauri.windows-offline.conf.json`（`webviewInstallMode: offlineInstaller`）覆盖默认配置，
产出后重命名加上 `-offline` 后缀，再作为额外资产附到同一个草稿 Release。
该配置同时关掉了 `createUpdaterArtifacts`，所以**它不需要更新签名密钥，也不会写入 `latest.json`**——
内网机器因此不会去联网检查更新。

> 只针对 Windows：macOS 用系统自带的 WKWebView、Linux 的 AppImage 本身就是自包含的，
> 都不存在「需要额外下载的运行时」这个问题，无需区分。

## 七、常见问题

- **Release 是草稿，没自动公开**：这是有意为之，方便你先检查安装包；确认后手动发布即可。
- **macOS 用户反馈「App 已损坏」**：属正常现象（未公证），让用户执行 `xattr -cr` 或右键打开；
  想彻底解决就按第四节做正式签名。
- **忘了加 `contents: write` 权限**：workflow 已经声明了，无需再改。
- **release 构建报 signing key 相关的错**：说明 `TAURI_SIGNING_PRIVATE_KEY` 还没加到 secrets，见第四节。
- **只想构建某一个平台**：临时注释掉 `.github/workflows/release.yml` 里 `matrix.include`
  中不需要的行即可。
