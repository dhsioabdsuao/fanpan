// ─────────────────────────────────────────────────────────────
// 文档型数据库可用性探针(一次性验证脚本)
//
// 对指定环境执行:写入一条测试文档 → 读回 → 删除,
// 三步全成即证明文档型数据库可正常使用。
// 验证完即删,不遗留任何数据。
//
// 运行方式:
//   TCB_ENV=bazi-d8gfpxs5ob010f6dc TENCENT_SECRET_ID=xxx TENCENT_SECRET_KEY=xxx \
//     node scripts/probe-community.mjs
// ─────────────────────────────────────────────────────────────

import cloudbase from '@cloudbase/node-sdk';

const ENV = process.env.TCB_ENV || '';
const SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';

if (!ENV || !SECRET_ID || !SECRET_KEY) {
  console.error('缺少配置:请设置 TCB_ENV / TENCENT_SECRET_ID / TENCENT_SECRET_KEY');
  process.exit(1);
}

const COLLECTION = 'probe-check';

async function main() {
  const app = cloudbase.init({ env: ENV, secretId: SECRET_ID, secretKey: SECRET_KEY });
  const db = app.database();
  const stamp = Date.now();

  console.log(`[0/4] 创建测试集合 ${COLLECTION}(已存在则跳过)…`);
  try {
    await db.createCollection(COLLECTION);
    console.log('      集合创建成功');
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (msg.includes('exist') || msg.includes('已存在') || msg.includes('EXIST')) {
      console.log('      集合已存在,跳过');
    } else {
      throw e;
    }
  }

  console.log(`[1/4] 写入测试文档到集合 ${COLLECTION} …`);
  const addRes = await db.collection(COLLECTION).add({ stamp, createdAt: new Date() });
  const docId = addRes?.id;
  if (!docId) throw new Error('写入失败:未返回文档 id');
  console.log(`      写入成功,文档 id = ${docId}`);

  console.log('[2/4] 读回验证 …');
  const getRes = await db.collection(COLLECTION).doc(docId).get();
  // 注意:node-sdk 的 doc.get() 返回 data 为数组形态
  const raw = getRes?.data;
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data || data.stamp !== stamp) {
    throw new Error(`读回校验失败:${JSON.stringify(data)}`);
  }
  console.log(`      读回成功,stamp 一致(${stamp})`);

  console.log('[3/4] 删除测试文档 …');
  await db.collection(COLLECTION).doc(docId).remove();
  // 删除后短轮询(最终一致性可能有亚秒级延迟)
  let gone = false;
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const afterRaw = (await db.collection(COLLECTION).doc(docId).get().catch(() => null))?.data;
    const after = Array.isArray(afterRaw) ? afterRaw[0] : afterRaw;
    if (!after) {
      gone = true;
      break;
    }
  }
  if (!gone) throw new Error('删除失败:轮询 3 秒后文档仍存在');
  console.log('      删除成功');

  console.log('\n✅ 探针通过:文档型数据库可正常读写,可以继续建集合。');
}

main().catch((e) => {
  console.error('\n❌ 探针失败:', e?.message ?? e);
  process.exit(1);
});
