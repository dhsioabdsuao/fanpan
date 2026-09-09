// ─────────────────────────────────────────────────────────────
// 广场种子内容脚本(CloudBase 版,幂等,可反复运行)
//
// 写入内容:
//   · 8 条求测帖(数据来自 scripts/seed-community-data.json,
//     由 lib 真实管线经 community/privacy.ts 脱敏生成)
//   · 每条帖 2-3 条演示批注(仅对新创建的帖写入)
//
// 演示作者使用合成 uid(seed-demo-1..3)+ 昵称快照,
// 客户端渲染只读快照字段,不依赖真实认证用户 —— 无需创建账号。
//
// 运行方式:
//   TCB_ENV=你的环境ID TENCENT_SECRET_ID=xxx TENCENT_SECRET_KEY=xxx \
//     node scripts/seed-community.mjs
//
//   密钥为腾讯云 API 密钥(CAM),获取方式:
//   腾讯云控制台 → 访问管理 → API 密钥管理 → 新建密钥。
//   密钥仅用于本机脚本(admin 权限),切勿提交到仓库。
//
// 幂等策略:帖子按 question 唯一性跳过;批注仅随新帖写入。
// ─────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cloudbase from '@cloudbase/node-sdk';

const ENV = process.env.TCB_ENV || '';
const SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';

if (!ENV || !SECRET_ID || !SECRET_KEY) {
  console.error('缺少配置:请设置 TCB_ENV / TENCENT_SECRET_ID / TENCENT_SECRET_KEY 环境变量');
  process.exit(1);
}

const app = cloudbase.init({ env: ENV, secretId: SECRET_ID, secretKey: SECRET_KEY });
const db = app.database();

const SEEDS = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'seed-community-data.json'), 'utf8'),
);

// 演示作者(合成 uid + 昵称快照,无真实账号)
const DEMO_AUTHORS = [
  { uid: 'seed-demo-1', nickname: '曜金先生' },
  { uid: 'seed-demo-2', nickname: '云中子' },
  { uid: 'seed-demo-3', nickname: '静水流深' },
];

// 每帖的演示批注(按 seed label 索引;称号为快照)
const ANNOTATIONS = {
  'seed-1': [
    { user: 1, title: '曜金大师', content: '伤官透干而身弱,印星为救应。年上庚金七杀遥克日主,先印后财,中年转运有望,忌急躁冒进。' },
    { user: 2, title: '命理师·金', content: '月令午火伤官当令,甲木坐辰得余气,不算无根。宜走水木运助身,换工作可待明年。' },
    { user: 3, title: '批注学徒·银', content: '初学浅见:伤官配印为贵格,可惜印星不显,还是要以稳为主。' },
  ],
  'seed-2': [
    { user: 2, title: '命理师·金', content: '壬水日主得申金长生,正官当令,中和偏旺。考编考的是官星,你原局官印相生,机会在秋冬。' },
    { user: 1, title: '曜金大师', content: '丁火正财坐午,财官印俱全,只要大运不伤印,此局可图功名。宜早备考,勿三心二意。' },
  ],
  'seed-3': [
    { user: 1, title: '曜金大师', content: '丙火坐子水正官,女命官星为夫。酉月财旺生官,晚婚反吉。丙午、丁未两年桃花宫动,可留心。' },
    { user: 3, title: '批注学徒·银', content: '财官印流通有情,是清秀之局。缘分未到不必强求,先修己身。' },
  ],
  'seed-4': [
    { user: 2, title: '命理师·金', content: '乙木无根,七杀当令且得势,从弱不论。喜火土金,忌水木。财运在火土之年,宜守不宜攻。' },
    { user: 1, title: '曜金大师', content: '杀重身轻,好在杀印相生有救。财运要等七杀得制之运,切莫重仓投机。' },
  ],
  'seed-5': [
    { user: 3, title: '批注学徒·银', content: '癸水坐卯,食神生财之象。子女缘看时柱,午火财星为子女星,头胎或为女儿。' },
    { user: 1, title: '曜金大师', content: '官星双透而破格,一生事业多受制。子女学业宜早培养独立习惯,不宜过严。' },
  ],
  'seed-6': [
    { user: 1, title: '曜金大师', content: '庚金坐申禄,身旺财旺,老来安稳之局。眼下不顺是流年冲克,2028 年后渐入佳境,不必忧心。' },
    { user: 2, title: '命理师·金', content: '正财格成格,一生不愁钱财,只是近两年运走比劫,破耗难免,守成即可。' },
  ],
  'seed-7': [
    { user: 2, title: '命理师·金', content: '食神格而破格,做餐饮辛苦钱是有,但先问自己能不能吃苦。食神生财的路子可以,选址比选行业重要。' },
    { user: 3, title: '批注学徒·银', content: '创业要看大运,眼下若走印比,宜合伙不宜独资。' },
  ],
  'seed-8': [
    { user: 1, title: '曜金大师', content: '癸水有根,官星双透,晚年运走金水之乡,退休后另有清福。早退无妨,宜养性修身。' },
    { user: 3, title: '批注学徒·银', content: '身弱喜印比,晚运可期。退休后多与老友走动,比闲居更养人。' },
  ],
};

async function postExists(question) {
  const res = await db.collection('Post').where({ question }).limit(1).get();
  return (res?.data?.length ?? 0) > 0;
}

/** 确保业务集合存在(已存在则跳过;集合名规则:不能以下划线开头) */
const COLLECTIONS = ['Post', 'Annotation', 'UserStats', 'Report'];

async function ensureCollections() {
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      console.log(`✓ 集合 ${name} 创建成功`);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes('exist') || msg.includes('已存在') || msg.includes('EXIST')) {
        console.log(`· 集合 ${name} 已存在,跳过`);
      } else {
        throw e;
      }
    }
  }
}

async function main() {
  console.log('── 确保业务集合 ──');
  await ensureCollections();

  let postsCreated = 0;
  let annsCreated = 0;

  for (const seed of SEEDS) {
    if (await postExists(seed.question)) {
      console.log(`· 帖子「${seed.question.slice(0, 12)}…」已存在,跳过`);
      continue;
    }
    const owner = DEMO_AUTHORS[0];
    const postRes = await db.collection('Post').add({
      authorUid: owner.uid,
      authorNickname: owner.nickname,
      question: seed.question,
      draft: seed.draft,
      annotationCount: 0,
      status: 'published',
      createdAt: new Date(),
    });
    const postId = postRes?.id;
    postsCreated++;
    console.log(`✓ 帖子「${seed.question.slice(0, 12)}…」(${seed.draft.baziBrief})`);

    const anns = ANNOTATIONS[seed.label] ?? [];
    for (const ann of anns) {
      const demo = DEMO_AUTHORS[ann.user - 1];
      await db.collection('Annotation').add({
        postId,
        authorUid: demo.uid,
        authorNickname: demo.nickname,
        authorTitle: ann.title,
        content: ann.content,
        status: 'published',
        createdAt: new Date(),
      });
      annsCreated++;
    }
    // 帖子批注计数对齐
    if (anns.length > 0) {
      await db.collection('Post').doc(postId).update({ annotationCount: anns.length });
    }
  }

  console.log(`\n完成:新帖 ${postsCreated} 条,批注 ${annsCreated} 条`);
}

main().catch((e) => {
  console.error('种子脚本失败:', e?.message ?? e);
  process.exit(1);
});
