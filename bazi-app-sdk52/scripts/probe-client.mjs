// ─────────────────────────────────────────────────────────────
// 客户端 SDK 连通性探针(用 Publishable Key 匿名访问)
//
// 验证三件事:
//   1. Publishable Key 能通过网关鉴权
//   2. Post 集合的「所有用户可读」规则生效(匿名可读)
//   3. 客户端 SDK 的 doc().get() 返回形状(应为数组)
//
// 运行方式(在 bazi-app-sdk52 目录,依赖本应用的 node_modules):
//   node scripts/probe-client.mjs
// ─────────────────────────────────────────────────────────────

import cloudbase from '@cloudbase/js-sdk';

const ENV = 'bazi-d8gfpxs5ob010f6dc';
const REGION = 'ap-shanghai';
const ACCESS_KEY =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2JhemktZDhnZnB4czVvYjAxMGY2ZGMuYXAtc2hhbmdoYWkudGNiLWFwaS50ZW5jZW50Y2xvdWRhcGkuY29tIiwic3ViIjoiYW5vbiIsImF1ZCI6ImJhemktZDhnZnB4czVvYjAxMGY2ZGMiLCJleHAiOjQwOTIwOTc3OTksImlhdCI6MTc4ODQxNDU5OSwibm9uY2UiOiI3dTBrUV9qWFJ4U2xmYmgxb3BuR1RnIiwiYXRfaGFzaCI6Ijd1MGtRX2pYUnhTbGZiaDFvcG5HVGciLCJuYW1lIjoiQW5vbnltb3VzIiwic2NvcGUiOiJhbm9ueW1vdXMiLCJwcm9qZWN0X2lkIjoiYmF6aS1kOGdmcHhzNW9iMDEwZjZkYyIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.nkPZd_3HK29tuuxxQO26PX4O9RmnGQo0cEe5oLxp9NBrcWbVQ1IxC7G3jzK3ACdhHSSLzbFvO9P5xStTSkh4bayAk1W9LBIhSIyczZ88af5-LpPULgsdhlVGULBbPlL2q0BGDBa9A1xBZPQ9VdPTaEc4t-1_eenInP8ZUJdVDZ0Y4aKad1oiAVQfj6PPbYUVK35WzK268B-_HhEMlNANL380EIaHx5ZoHmZqOceyoA-epc-GFK_QiLg5qE_fS_9ysyFtONjbFOGSyCT5Sl5CyhTDcZxlsCONJTejX4BO49qT3i12iIzi4HuuLZyffHLs3C-WjwYtG27rZkIJkUdSbw';

const app = cloudbase.init({
  env: ENV,
  region: REGION,
  accessKey: ACCESS_KEY,
});
const db = app.database();

async function main() {
  console.log('[1/3] 匿名查询 Post 列表(limit 5)…');
  const listRes = await db
    .collection('Post')
    .where({ status: 'published' })
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  const docs = listRes?.data;
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error(`查询失败或为空:${JSON.stringify(listRes).slice(0, 300)}`);
  }
  console.log(`      读到 ${docs.length} 条,首条:「${docs[0].question?.slice(0, 16)}…」`);
  console.log(`      首条字段:draft=${!!docs[0].draft} annotationCount=${docs[0].annotationCount}`);

  const firstId = docs[0]._id;
  console.log(`[2/3] 单文档读取(doc(${firstId.slice(0, 12)}…).get())…`);
  const docRes = await db.collection('Post').doc(firstId).get();
  const raw = docRes?.data;
  const shape = Array.isArray(raw) ? `数组,长度 ${raw.length}` : typeof raw;
  console.log(`      data 形状:${shape}`);
  const doc = Array.isArray(raw) ? raw[0] : raw;
  if (!doc || doc._id !== firstId) throw new Error('单文档读取校验失败');

  console.log('[3/3] UserStats 匿名读取应被规则拒绝…');
  try {
    const statsRes = await db.collection('UserStats').doc('test-anon-read').get();
    const arr = Array.isArray(statsRes?.data) ? statsRes.data : [statsRes?.data];
    if (arr.length > 0 && arr[0]) {
      console.log('      ⚠️ 匿名读到了 UserStats,权限规则可能没生效!');
    } else {
      console.log('      匿名读返回空(规则生效)');
    }
  } catch (e) {
    console.log(`      匿名读被拒绝(规则生效):${String(e?.message ?? e).slice(0, 80)}`);
  }

  console.log('\n✅ 客户端连通性探针通过:Key 有效、Post 匿名可读、形状确认。');
}

main()
  .catch((e) => {
    console.error('\n❌ 探针失败:', e?.message ?? e);
    process.exit(1);
  })
  .finally(() => {
    setTimeout(() => process.exit(0), 300); // SDK 保活连接不退出,主动收尾
  });
