# 发布与打包（RELEASING）

本文说明如何自动构建三平台安装包并发布版本。**普通构建不需要任何密钥**——只有想让安装包
「签名」（避免系统安全警告）时才需要额外配置。

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

> 也可以在 Actions 页面手动触发该 workflow（workflow_dispatch）来试跑，但手动触发没有 tag，
> 不会创建 Release，只用来验证能否构建成功。

## 二、本地打包（可选）

```bash
pnpm install
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/` 下。

## 三、签名密钥（可选，仅用于消除安全警告）

不配置这些密钥，安装包一样能用，只是 macOS 会提示「无法验证开发者」、Windows 会弹
SmartScreen。要消除这些提示，才需要下面的密钥。

所有密钥都放在仓库的 **Settings → Secrets and variables → Actions → New repository secret**。

### macOS 签名与公证

需要 Apple Developer 账号（付费）。

1. 在 Apple Developer 后台创建并下载 **Developer ID Application** 证书，导出为带密码的
   `.p12` 文件。
2. 把 `.p12` 转成 base64 文本（macOS 上）：

   ```bash
   base64 -i DeveloperID.p12 | pbcopy
   ```

3. 到 appleid.apple.com 生成一个 **App 专用密码**（Apple ID 密码不能用）。
4. 新建以下 secrets：

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

### Windows 签名

需要一张代码签名证书（`.pfx`）。

1. 把 `.pfx` 转成 base64：

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

## 四、常见问题

- **Release 是草稿，没自动公开**：这是有意为之，方便你先检查安装包；确认后手动发布即可。
- **忘了加 `contents: write` 权限**：workflow 已经声明了，无需再改。
- **只想构建某一个平台**：临时注释掉 `.github/workflows/release.yml` 里 `matrix.include`
  中不需要的行即可。
