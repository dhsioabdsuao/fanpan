# App Store Connect 提交材料

> 应用：**四柱八字** | 版本：**1.0.0** | Bundle ID：**com.bazi.app**

---

## 1. 截图 (Screenshots)

### 必需的截图尺寸

| 设备 | 尺寸 | 要求 |
|------|------|------|
| iPhone 6.7" (如 iPhone 14 Pro Max) | 1290 × 2796 px | **必须提供** |
| iPhone 6.5" (如 iPhone 11 Pro Max) | 1242 × 2688 px | **必须提供** |
| iPhone 5.5" (如 iPhone 8 Plus) | 1242 × 2208 px | 如果支持则需要 |
| iPad Pro 12.9" | 2048 × 2732 px | 如果支持 iPad 则需要 |

### 建议截图内容（至少 3-5 张）

1. **首页 — 生辰输入页面**：展示阳历/农历日期选择、出生地点、性别选择
2. **排盘结果 — 四柱表格**：展示八字排盘的完整结果
3. **格局分析 + 强弱分析**：展示命局核心分析
4. **人生叙事**：用现代语言解读命局的叙事卡片
5. **大运流年**：展示人生各阶段趋势

### 截图规范
- 状态栏保持干净（时间显示 9:41，信号/电量满格）
- 不要在截图中包含个人敏感信息
- 背景统一为 宣纸色 (#f5f0e8)
- 确保文字清晰可读

**注意**：截图需要通过模拟器或真机截取，建议在以下设备上操作：
```bash
# 启动 Expo 开发服务器
cd bazi-app-sdk52 && npx expo start

# 在 iOS 模拟器中运行（需要 Xcode）
npx expo run:ios
```

---

## 2. 推广文本 (Promotional Text)

> 最多 170 字符。可在过审后随时修改，无需重新审核。

```
四柱八字 — 基于《渊海子平》《滴天髓》等经典古籍，结合真太阳时校正与现代天文算法，专业排盘分析。本地离线，隐私无忧。
```

（见 `APP_STORE_PROMOTIONAL.txt`）

---

## 3. 描述 (Description)

> 见 `APP_STORE_DESCRIPTION.txt`，以下为最终版：

```
四柱八字 — 命局叙事排盘

四柱八字是一款基于传统子平命理学的专业排盘工具。

【核心功能】
• 真太阳时校正 + 节气精准匹配，排盘结果严谨可靠
• 格局判定遵循《子平真诠》，覆盖正八格、从格、化格
• 强弱分析采用《滴天髓》三要素法（得令、得地、得势）
• 神煞系统覆盖 54 颗星种，逐柱精准查表
• 调候用神参考《穷通宝鉴》120 条规则
• 大运流年完整排盘，清晰展示人生各阶段趋势
• 命局叙事引擎：用现代语言解读您的八字，不堆砌术语，说人话
• 历史记录本地保存，随时查看、随时删除

【隐私保护】
所有数据存储在设备本地，不上传、不追踪、不分析。离线可用。

【免责声明】
本工具仅供文化研究与娱乐参考，不构成人生决策建议。
知命而不认命，愿您把握当下、创造未来。
```

---

## 4. 关键词 (Keywords)

> 最多 100 字符（每个中文字算 1 字符）。当前字数：**99 字符**，刚好在限制内。

```
八字,排盘,命理,算命,运势,子平,四柱,命局,八字算命,八字排盘,紫微,易经,风水,五行,天干地支,日柱,命盘,运程,流年,生肖,大运,太岁,神煞,穷通宝鉴,滴天髓,三命通会,渊海子平,格局,调候
```

---

## 5. 技术支持网址 (Technical Support URL)

### 选项 A — 使用 GitHub Issues（推荐，免费）

```
https://github.com/dhsioabdsuao/fanpan/issues
```

### 选项 B — 使用邮箱链接

```
mailto:support@example.com
```

> ⚠️ 请确认 GitHub Issues 公开可见，或替换为你的实际联系方式。

---

## 6. 营销网址 (Marketing URL)

### 使用 GitHub Pages（推荐）

```
https://dhsioabdsuao.github.io/fanpan/
```

> ⚠️ 如果尚未启用 GitHub Pages：
> 1. 前往 `https://github.com/dhsioabdsuao/fanpan/settings/pages`
> 2. Source 选择 `main` 分支，根目录 `/`
> 3. 保存后等待部署完成

---

## 7. 版本 (Version)

- **版本号**：`1.0.0`
- **Build 号**：`1`（每次上传新构建时递增）

`app.json` 和 `Info.plist` 中已配置为 `1.0.0`。

---

## 8. 版权 (Copyright)

```
Copyright © 2026 Tony. All rights reserved.
```

> 在 App Store Connect → 定价与销售 → 版权 处填写。

---

## 9. 路由 App 覆盖地区文件 (Routing App Coverage File)

**此字段不适用于本应用。**

这个字段仅供支持路线导航功能的应用（如地图、打车、骑行应用）使用，需要上传 `.geojson` 格式的地理覆盖范围文件。

四柱八字是工具类应用，**此字段留空即可**，不影响提交审核。

---

## 10. 其他 App Store Connect 必填项

### App 隐私标签 (App Privacy)

由于本应用**不收集任何数据**、完全离线使用，隐私标签全部选择"未收集数据"：

| 数据类型 | 是否收集 |
|----------|----------|
| 联系信息 | 否 |
| 健康与健身 | 否 |
| 财务信息 | 否 |
| 位置 | 否 |
| 敏感信息 | 否 |
| 联系人 | 否 |
| 用户内容 | 否 |
| 浏览历史 | 否 |
| 搜索历史 | 否 |
| 标识符 | 否 |
| 购买 | 否 |
| 使用数据 | 否 |
| 诊断 | 否 |
| 其他数据 | 否 |

### 内容版权

- 此应用不包含、不展示、不访问第三方内容
- 频率：无

### 出口合规

- 加密算法使用：**否**（本应用使用标准 HTTPS 且不包含自定义加密）
- 法国加密声明：不适用

### App 类别

- 主类别：**参考** (Reference)
- 次类别：**生活** (Lifestyle) 或 **娱乐** (Entertainment)

### 年龄分级

- 建议年龄：**4+**（无令人反感的内容）

---

## 11. 隐私政策 URL

隐私政策已通过 GitHub Pages 托管：

```
https://dhsioabdsuao.github.io/fanpan/privacy.html
```

隐私政策 HTML 文件位于仓库根目录 `privacy.html`。

---

## 12. 构建与上传 (Build & Upload)

### 使用 EAS Build 构建生产版本

```bash
cd bazi-app-sdk52

# iOS 生产构建（需要 Apple Developer 账号）
npx eas build --platform ios --profile production

# 构建完成后，EAS 会自动上传到 App Store Connect
npx eas submit --platform ios
```

### 本地构建（如有 Xcode）

```bash
cd bazi-app-sdk52
npx expo prebuild --platform ios
# 然后在 Xcode 中打开 ios/ 项目进行 Archive → Distribute
```

---

## 提交前检查清单

- [ ] **GitHub Pages 已启用**：前往 `https://github.com/dhsioabdsuao/fanpan/settings/pages` 确认
- [ ] **隐私政策可访问**：`https://dhsioabdsuao.github.io/fanpan/privacy.html`
- [ ] 截图已截取并上传（至少 3 套尺寸：6.7" + 6.5" + 5.5"）
- [ ] 推广文本已填写（`APP_STORE_PROMOTIONAL.txt`）
- [ ] 描述已填写（`APP_STORE_DESCRIPTION.txt`）
- [ ] 关键词已填写（`APP_STORE_KEYWORDS.txt`）
- [ ] 技术支持网址已填写（GitHub Issues 或邮箱）
- [ ] 营销网址已填写（GitHub Pages 主页）
- [ ] 隐私政策 URL 已填写
- [ ] 版权信息已填写：`Copyright © 2026 Tony. All rights reserved.`
- [ ] App 隐私标签已设置（全部选"否"）
- [ ] 内容版权声明已提交
- [ ] 出口合规信息已提交
- [ ] 主类别：参考 / 次类别：生活
- [ ] 年龄分级：4+
- [ ] 构建版本已上传（通过 EAS Build `production` profile）
- [ ] **注意**：`.env.local` 中的 API key 不会被打包（已 gitignored）
