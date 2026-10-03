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

### 关于 ExamBot 里的 `TAURI_SIGNING_PRIVATE_KEY`

你在 ExamBot 的 workflow 里看到 `TAURI_SIGNING_PRIVATE_KEY`，它**和 macOS 签名无关**：
那是 Tauri **应用内自动更新（updater）** 用的 minisign 密钥，用来给更新包签名与校验
（用 `pnpm tauri signer generate` 生成）。只有启用了 updater 才需要，本项目目前没有开启，
因此**你不需要提供它**。

## 四、可选：Apple Developer 正式签名与公证

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

## 五、可选：Windows 签名

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

## 六、常见问题

- **Release 是草稿，没自动公开**：这是有意为之，方便你先检查安装包；确认后手动发布即可。
- **macOS 用户反馈「App 已损坏」**：属正常现象（未公证），让用户执行 `xattr -cr` 或右键打开；
  想彻底解决就按第四节做正式签名。
- **忘了加 `contents: write` 权限**：workflow 已经声明了，无需再改。
- **只想构建某一个平台**：临时注释掉 `.github/workflows/release.yml` 里 `matrix.include`
  中不需要的行即可。
