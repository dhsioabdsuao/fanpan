<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 八字核心逻辑开发制度(2026-08 全面体检后确立)

本仓库的核心算法在 `lib/`(Web 与 RN 通过符号链接共享同一份代码)。历史上反复出现"修一处、坏另一处"的问题,以下制度为强制性要求:

## 规则

1. **修复必带测试**:任何 `lib/` 逻辑修复必须在同一提交内添加或更新回归测试。没有测试的修复不允许合并。
2. **断言结构化字段,不断言文案**:新行为一律断言结构化结果(如 `pattern.category`、`outcome.outcome`、`xiYong.favorable`),禁止用 `toContain` 断言生成文案的措辞。文案措辞变化不应导致测试失败;文案与结论的一致性由结构化字段测试保证。
3. **单一结论源**:文案模块(`lib/bage/generateAnalysis.ts`、`narrative.ts`、`careerGuidance.ts`、`healthGuidance.ts`)只消费计算层的结构化结果,不得自行重新推导判断(如自算气候、自判格局、自算喜忌)。新增文案模块同样遵守。
4. **规格书即规则**:`docs/格局规格书.md`、`docs/强弱规格书.md`、`docs/喜忌规格书.md` 是规则的唯一依据。规则变更顺序:改规格书 → 用户批准 → 改代码(注释引用【规格书 x.y】)→ 加测试。
5. **基线对照**:`lib/__tests__/cong-ge-baseline.test.ts` 锁定从格/化格命盘的完整判定状态。任何导致其期望变化的改动,必须人工确认是有意为之,并在提交信息中说明。
6. **验收命令**(每批改动后必须全绿):
   - `pnpm test:run` — 全部测试
   - `pnpm test:coverage` — 覆盖率报告
   - `pnpm typecheck` — 根类型检查
   - `pnpm typecheck:rn` — RN 类型检查

