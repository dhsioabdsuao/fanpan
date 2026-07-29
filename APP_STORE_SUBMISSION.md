# 四柱八字 · App Store 上架方案书

> 版本 1.0 · 2026-07-29 · Bundle ID: `com.bazi.app`

---

## 一、项目概览

| 项目 | 内容 |
|------|------|
| App 名称 | 四柱八字 |
| 副标题 | 命局叙事排盘 |
| 版本号 | 1.0.0 |
| Build 号 | 1 |
| Bundle ID | com.bazi.app |
| 技术栈 | Expo SDK 57 + React Native 0.86 |
| 构建方式 | EAS Build (production profile) |
| 最低 iOS | 12.0 |
| 支持设备 | iPhone（竖屏）、iPad（竖屏+横屏） |
| 语言 | 简体中文 |
| App 类别 | 主：参考 (Reference) / 次：生活 (Lifestyle) |
| 年龄分级 | 4+ |
| 价格 | 免费 |

---

## 二、网址方案

Apple 严格要求：**技术支持网址与隐私政策网址必须是两个不同的 URL，各自指向独立的可访问页面。**

经调研确认：**GitHub Pages (`github.io`) 域名被 Apple App Store Connect 完全接受**，大量独立开发者使用此方案成功上架。不被接受的情况仅出现在：链接失效（404）、页面内容为空、缺少联系方式、或隐私政策内容与实际数据收集不符。与域名本身无关。

### 网址清单

| 字段 | URL | 必填 | 状态 |
|------|-----|------|------|
| 隐私政策网址 | `https://dhsioabdsuao.github.io/fanpan/privacy.html` | 是 | ✅ 已验证 (HTTP 200) |
| 技术支持网址 | `https://dhsioabdsuao.github.io/fanpan/support.html` | 是 | ✅ 已验证 (HTTP 200) |
| 营销网址 | `https://dhsioabdsuao.github.io/fanpan/` | 否 | ✅ 已验证 (HTTP 200) |

### 各页面对照 Apple 审核要求

**隐私政策页面 (`privacy.html`)**：
- ✅ 明确标注 App 名称（四柱八字）
- ✅ 逐项列明数据收集情况（不收集任何数据）
- ✅ 说明本地存储机制
- ✅ 说明网络使用情况（离线可用）
- ✅ 说明第三方服务（无任何第三方服务）
- ✅ 包含联系方式（邮箱 + GitHub Issues）
- ✅ 标注更新日期（2026年7月27日）
- ✅ 免责声明

**技术支持页面 (`support.html`)**：
- ✅ App 名称和版本号
- ✅ 常见问题（FAQ）
- ✅ 算法来源说明
- ✅ 联系方式（邮箱 + GitHub Issues）
- ✅ 链接到隐私政策

**落地页 (`index.html`)**：
- App 介绍和核心功能展示
- 链接到隐私政策
- （营销网址非必填，如不想填可留空）

### 注意

若在 App Store Connect 中填写 URL 时报格式错误：
1. **手动逐字输入**，不要复制粘贴（避免带入不可见字符）
2. 确认首尾无空格
3. 确认是 `https://` 而非 `https//`

---

## 三、构建与 Archive 方案

这是上架最核心的一步。当前状态：**尚未执行 Archive 构建。**

### 环境现状

| 项目 | 状态 |
|------|------|
| Xcode 26.6 (Build 17F113) | ✅ 已安装 |
| Apple Developer 账号 | ⚠️ 需确认（注册中） |
| EAS CLI | ⚠️ 版本较旧，需更新 |
| iOS 工程 (`ios/`) | ✅ 已就绪 |
| app.json 配置 | ✅ 已配置 |

### 构建方案：EAS Build（推荐）

EAS Build 是 Expo 官方提供的云端构建服务，自动处理证书签名，无需本地配置 Xcode 签名。

**步骤一：更新 EAS CLI 并登录**
```bash
npm install -g eas-cli
eas login
```

**步骤二：确认 EAS 项目配置**
```bash
cd bazi-app-sdk52
eas init   # 如果尚未初始化，关联到 expo.dev 项目
```

当前 `eas.json` 已配置：
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": { "resourceClass": "m-medium" }
    }
  }
}
```

**步骤三：执行生产构建**
```bash
eas build --platform ios --profile production
```

此命令会：
1. 将代码上传到 Expo 云端
2. 自动管理 iOS 签名证书（Distribution Certificate + Provisioning Profile）
3. 构建 `.ipa` 文件（即 Archive 产物）
4. 构建完成后返回下载链接

**步骤四：提交到 App Store Connect**
```bash
eas submit --platform ios --profile production
```

此命令将 `.ipa` 上传至 App Store Connect，出现在 TestFlight 中。

**步骤五：在 App Store Connect 中完成上架**
1. 等待构建处理完毕（TestFlight 中状态变为"就绪"，约 10-30 分钟）
2. 在「App Store」标签页填写所有元数据
3. 选择构建版本
4. 点击「提交审核」

### 备选方案：Xcode 本地 Archive

如果 EAS 云端构建遇到问题，可回退到本地 Xcode Archive：

```bash
cd bazi-app-sdk52
npx expo prebuild --platform ios --clean
open ios/app.xcworkspace
```

然后在 Xcode 中：
1. 选择目标设备为「Any iOS Device (arm64)」
2. Product → Archive
3. Organizer 窗口 → Distribute App → App Store Connect

---

## 四、App Store Connect 全部字段清单

### 4.1 App 信息

| 字段 | 内容 | 限制 |
|------|------|------|
| 名称 | 四柱八字 | 30 字符 |
| 副标题 | 命局叙事排盘 | 30 字符 |
| 类别（主） | 参考 | — |
| 类别（次） | 生活 | — |
| 年龄分级 | 4+ | — |

### 4.2 版本信息

| 字段 | 内容 | 限制 |
|------|------|------|
| 描述 | 见 `APP_STORE_DESCRIPTION.txt` | 4000 字符 |
| 关键词 | 见 `APP_STORE_KEYWORDS.txt` | 100 字符 |
| 推广文本 | 见 `APP_STORE_PROMOTIONAL.txt` | 170 字符 |
| 技术支持网址 | `https://dhsioabdsuao.github.io/fanpan/support.html` | 250 字符 |
| 营销网址 | `https://dhsioabdsuao.github.io/fanpan/` | 255 字符（选填） |
| 版权 | `Copyright © 2026 Tony. All rights reserved.` | — |

### 4.3 隐私与合规

| 字段 | 内容 |
|------|------|
| 隐私政策网址 | `https://dhsioabdsuao.github.io/fanpan/privacy.html` |
| App 隐私标签 | 全部选择「不收集数据」（共 14 类全部为"否"） |
| 内容版权声明 | 不包含、不展示、不访问第三方内容 |
| 出口合规 | 不使用加密（标准 HTTPS 除外） |

### 4.4 App 审核信息

| 字段 | 内容 |
|------|------|
| 联系人 | 填写开发者真实姓名和电话 |
| 备注 | 无需登录，全部功能可自由使用。所有计算均在设备本地完成，不依赖网络。 |

### 4.5 不适用字段

| 字段 | 原因 |
|------|------|
| 路由 App 覆盖地区文件 | 本应用不是导航/地图类 App，此字段不适用，留空 |
| App 内购买 | 无内购，无需配置 |
| 订阅 | 无订阅，无需配置 |
| 登录信息 | 无需登录，无需提供测试账号 |

---

## 五、截图方案

### 5.1 设备尺寸要求

Apple 当前要求至少提供以下尺寸的截图：

| 设备 | 分辨率 | 必需？ |
|------|--------|--------|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320 × 2868 | ✅ 必需 |
| iPhone 6.7" (iPhone 14 Pro Max) | 1290 × 2796 | ✅ 必需 |
| iPhone 6.5" (iPhone 11 Pro Max) | 1242 × 2688 | 可选（自动缩放） |

> 当前 App Store Connect 只需上传 **6.9"** 尺寸，其他尺寸由系统自动缩放生成。

### 5.2 截图内容（建议 5 张）

| 序号 | 画面 | 展示内容 |
|------|------|----------|
| 1 | 首页 | 日期选择、地点输入、性别选择、「开始排盘」按钮 |
| 2 | 排盘结果 | 四柱天干地支表、日主标注、五行分布 |
| 3 | 格局分析 | 格局名称与解析、日主强弱判定结果 |
| 4 | 命局叙事 | 叙事引擎生成的自然语言解读 |
| 5 | 大运流年 | 大运起运时间、流年列表 |

### 5.3 截图方式

**使用 iOS 模拟器（推荐）**：
```bash
cd bazi-app-sdk52
npx expo run:ios
# 模拟器菜单 → File → Save Screenshot
```

模拟器截图即为设备原生分辨率，无需后期缩放。

**截图规范**：
- 状态栏时间设为 9:41，信号/Wi-Fi/电量满格
- 不要包含个人敏感信息
- 使用模拟数据（如 1990-01-01 的八字结果）
- 确保中文文字清晰可读

---

## 六、完整执行流程

### 第一阶段：即时可做（材料就绪）

- [x] 推广文本 → `APP_STORE_PROMOTIONAL.txt`
- [x] 描述 → `APP_STORE_DESCRIPTION.txt`
- [x] 关键词 → `APP_STORE_KEYWORDS.txt`
- [x] 隐私政策页面 → `privacy.html`（已含联系方式）
- [x] 技术支持页面 → `support.html`（独立 URL）
- [x] 落地页 → `index.html`
- [x] app.json 隐私清单 → `privacyManifests` 已配置
- [x] 版权文案 → `Copyright © 2026 Tony. All rights reserved.`

### 第二阶段：App Store Connect 中操作

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 创建新 App → 填入名称、Bundle ID、语言
3. 按本方案书**第四节**逐项填写所有元数据
4. 按本方案书**第五节**截取并上传截图
5. 设置定价为免费（或选定价格）
6. 选择覆盖地区（默认全球）

### 第三阶段：Archive 构建

1. 确认 Apple Developer 账号已注册完成
2. 在 App Store Connect 中记录 App ID
3. 更新 EAS CLI → `npm install -g eas-cli`
4. 执行 `eas build --platform ios --profile production`
5. 构建成功后执行 `eas submit --platform ios --profile production`
6. 等待 .ipa 上传至 TestFlight

### 第四阶段：最终提交

1. 确认所有元数据已填写、截图已上传
2. 确认三个 URL 均可访问（已验证 HTTP 200）
3. 在 App Store Connect 中选择刚上传的构建版本
4. 点击「提交审核」

---

## 七、常见被拒原因及对策

| 被拒原因 | 本应用对策 |
|----------|-----------|
| 隐私政策 URL 无法访问 | ✅ 已验证 HTTP 200，页面完整 |
| 隐私政策与实际数据收集不符 | ✅ 不收集任何数据，政策如实声明 |
| 技术支持 URL 无联系方式 | ✅ support.html 包含邮箱和 GitHub Issues |
| 技术支持 URL 与隐私政策 URL 相同 | ✅ 两个独立页面，URL 不同 |
| 截图与实际功能不符 | ⚠️ 需确保截图来自真实 App 运行画面 |
| 缺少 App 隐私标签 | ✅ app.json 已配置 privacyManifests |
| 崩溃或 Bug | ⚠️ 提交前充分测试 |
| 缺少免责声明 | ✅ 描述和隐私政策中均有免责声明 |
| 使用非公开 API | ✅ 使用标准 Expo SDK API |

---

## 八、文件索引

```
/Users/apple/Desktop/bazi-site/
├── APP_STORE_SUBMISSION.md      ← 本方案书
├── APP_STORE_DESCRIPTION.txt    ← App Store 描述
├── APP_STORE_KEYWORDS.txt       ← App Store 关键词
├── APP_STORE_PROMOTIONAL.txt    ← App Store 推广文本
├── index.html                   ← GitHub Pages 落地页
├── privacy.html                 ← 隐私政策页面
├── support.html                 ← 技术支持页面
└── bazi-app-sdk52/
    ├── app.json                 ← Expo 配置（含隐私清单）
    ├── eas.json                 ← EAS 构建配置
    └── ios/                     ← iOS 原生工程
```
