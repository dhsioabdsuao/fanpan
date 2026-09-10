// ─────────────────────────────────────────────────────────────
// 社区实测辅助:云端集合检查器(只读,配合双账号实测剧本)
//
// 用法:
//   TCB_ENV=xxx TENCENT_SECRET_ID=xxx TENCENT_SECRET_KEY=xxx \
//     node scripts/inspect-community.mjs Post          # 查看集合
//     node scripts/inspect-community.mjs Post draft    # 只看 draft 字段键(脱敏核对)
//     node scripts/inspect-community.mjs Report        # 举报核对
//
// 输出集合最近 5 条文档的关键字段(按 createdAt 倒序)。
// ─────────────────────────────────────────────────────────────

import cloudbase from '@cloudbase/node-sdk';

const ENV = process.env.TCB_ENV || '';
const SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';

if (!ENV || !SECRET_ID || !SECRET_KEY) {
  console.error('缺少配置:请设置 TCB_ENV / TENCENT_SECRET_ID / TENCENT_SECRET_KEY');
  process.exit(1);
}

const COLLECTION = process.argv[2];
const MODE = process.argv[3]; // 缺省=关键字段;'draft'=只看 draft 键

if (!COLLECTION) {
  console.error('用法:node scripts/inspect-community.mjs <集合名> [draft]');
  process.exit(1);
}

const TRIM = (s) => (typeof s === 'string' && s.length > 40 ? s.slice(0, 40) + '…' : s);

async function main() {
  const app = cloudbase.init({ env: ENV, secretId: SECRET_ID, secretKey: SECRET_KEY });
  const db = app.database();

  const res = await db
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  const docs = Array.isArray(res?.data) ? res.data : [];

  console.log(`── ${COLLECTION} 最近 ${docs.length} 条 ──`);
  if (!docs.length) {
    console.log('(空集合)');
    return;
  }

  for (const d of docs) {
    const id = d._id ? String(d._id).slice(0, 10) : '(无 _id)';
    const t = d.createdAt ? String(d.createdAt).slice(0, 19).replace('T', ' ') : '(无时间)';

    if (MODE === 'draft' && COLLECTION === 'Post') {
      console.log(`\n[id ${id}] ${t}`);
      console.log(`  draft 字段键:${d.draft ? Object.keys(d.draft).sort().join(', ') : '(无 draft)'}`);
      continue;
    }

    if (COLLECTION === 'Post') {
      console.log(`\n[id ${id}] ${t}`);
      console.log(`  标题:${TRIM(d.title)}`);
      console.log(`  authorUid:${d.authorUid ?? '(无)'}`);
      console.log(`  批注数:${d.annotCount ?? 0} 评论展示:${TRIM(d.authorNickname)}`);
      if (MODE !== 'keys-only') {
        console.log(`  draft 键:${d.draft ? Object.keys(d.draft).sort().join(', ') : '(无)'}`);
      }
    } else if (COLLECTION === 'Annotation') {
      console.log(`\n[id ${id}] ${t}`);
      console.log(`  postId:${TRIM(d.postId)} authorUid:${d.authorUid ?? '(无)'}`);
      console.log(`  内容:${TRIM(d.content)}`);
    } else if (COLLECTION === 'UserStats') {
      console.log(`\n[id ${id}] ${t}`);
      console.log(`  uid:${d.uid ?? '(无)'} nickname:${d.nickname ?? '(无)'}`);
      console.log(`  titleCount:${d.titleCount ?? '(无)'} postCount:${d.postCount ?? '(无)'}`);
    } else if (COLLECTION === 'Report') {
      console.log(`\n[id ${id}] ${t}`);
      console.log(`  全文:${JSON.stringify(d).slice(0, 300)}`);
    } else {
      console.log(`\n[id ${id}] ${t} ${JSON.stringify(d).slice(0, 300)}`);
    }
  }
  console.log('\n(完)');
}

main().catch((e) => {
  console.error('查询失败:', e?.message ?? e);
  process.exit(1);
});
