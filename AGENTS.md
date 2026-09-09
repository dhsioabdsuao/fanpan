<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 八字核心逻辑开发制度(2026-08 全面体检后确立)

本仓库的核心算法在 `lib/`(Web 与 RN 通过符号链接共享同一份代码)。历史上反复出现"修一处、坏另一处"的问题,以下制度为强制性要求。

社区功能(2026-08 起)的共享纯逻辑在 `community/`(与 `lib/` 平级,同样经符号链接进 RN)。**社区代码不进 `lib/`**,`community/` 只允许依赖 `lib/` 与 `types/`(反向依赖禁止)。

## 规则

1. **修复必带测试**:任何 `lib/` 与 `community/` 逻辑修复必须在同一提交内添加或更新回归测试。没有测试的修复不允许合并。
2. **断言结构化字段,不断言文案**:新行为一律断言结构化结果(如 `pattern.category`、`outcome.outcome`、`xiYong.favorable`),禁止用 `toContain` 断言生成文案的措辞。文案措辞变化不应导致测试失败;文案与结论的一致性由结构化字段测试保证。
3. **单一结论源**:文案模块(`lib/bage/generateAnalysis.ts`、`narrative.ts`、`careerGuidance.ts`、`healthGuidance.ts`)只消费计算层的结构化结果,不得自行重新推导判断(如自算气候、自判格局、自算喜忌)。新增文案模块同样遵守。
4. **规格书即规则**:`docs/格局规格书.md`、`docs/强弱规格书.md`、`docs/喜忌规格书.md` 是规则的唯一依据。规则变更顺序:改规格书 → 用户批准 → 改代码(注释引用【规格书 x.y】)→ 加测试。
5. **基线对照**:`lib/__tests__/cong-ge-baseline.test.ts` 锁定从格/化格命盘的完整判定状态。任何导致其期望变化的改动,必须人工确认是有意为之,并在提交信息中说明。
6. **验收命令**(每批改动后必须全绿):
   - `pnpm test:run` — 全部测试
   - `pnpm test:coverage` — 覆盖率报告
   - `pnpm typecheck` — 根类型检查
   - `pnpm typecheck:rn` — RN 类型检查

## 社区功能速查

- 后端:**腾讯云开发 CloudBase**(文档型数据库 + 内置手机号 OTP 认证;原选 LeanCloud 已停服,2026-09 迁移)。SDK 调用全部封装在 `bazi-app-sdk52/services/cloudbase.ts` 与 `community.ts`(界面层只认 `community/` DTO)。
- 环境配置:`bazi-app-sdk52/services/cloudbase-config.ts`(env/region/accessKey)。
- 数据库权限由 CloudBase **安全规则**保证(Post/Annotation 全员可读、登录可写;UserStats 仅本人),规则 JSON 见 `docs/社区上线手册.md`。
- 开发验证:**Expo Go 不可用**(适配器依赖 MMKV 原生模块),用 EAS 开发构建装进模拟器一次,之后 `npx expo start` 秒级热更新与 Expo Go 一致。
- 种子内容(防冷启动空广场,幂等可反复运行):
  ```
  TCB_ENV=你的环境ID TENCENT_SECRET_ID=xxx TENCENT_SECRET_KEY=xxx \
    node scripts/seed-community.mjs
  ```
  数据文件 `scripts/seed-community-data.json` 由 lib 真实管线经 `community/privacy.ts` 脱敏生成;更新种子内容时先用临时测试重新生成该 JSON(参考历史做法:community/__tests__ 下临时测试 → 写文件 → 删除)。
- 隐私红线:云上只存 `PostDraft` 白名单字段(四柱+性别+衍生摘要),发布请求体经 `PostDraftSchema` strip,双保险。改动 `community/privacy.ts` 必须同步改 `privacy.test.ts` 的字段全集断言。

