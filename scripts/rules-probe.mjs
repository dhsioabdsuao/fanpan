// ─────────────────────────────────────────────────────────────
// 安全规则探针:在 Mac 上以真实用户身份走 CloudBase 客户端 SDK,
// 复现 App 的读写行为,快速定位安全规则问题(避免控制台来回改)。
//
// 用法:
//   node scripts/rules-probe.mjs <手机号>
//   发送验证码后,脚本轮询 /tmp/otp-code.txt,把收到的验证码写入该文件。
//
// 测试矩阵:
//   [1] UserStats.set(uid) —— 验证 create 规则(request.data.uid == auth.uid)
//   [2] Post.add            —— 验证 auth != null 规则(隔离 auth 是否可见)
// ─────────────────────────────────────────────────────────────

import fs from 'node:fs';
import { createRequire } from 'node:module';

// 从 RN 应用的 node_modules 解析(与 App 同一份 SDK)
const require = createRequire('/Users/apple/Desktop/bazi-site/bazi-app-sdk52/package.json');
const cloudbase = require('@cloudbase/js-sdk');
const { StorageType, AbstractSDKRequest } = require('@cloudbase/adapter-interface');

const PHONE = process.argv[2];
if (!PHONE) {
  console.error('用法: node scripts/rules-probe.mjs <手机号>');
  process.exit(1);
}

const ENV = 'bazi-d8gfpxs5ob010f6dc';
const REGION = 'ap-shanghai';
const ACCESS_KEY =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2JhemktZDhnZnB4czVvYjAxMGY2ZGMuYXAtc2hhbmdoYWkudGNiLWFwaS50ZW5jZW50Y2xvdWRhcGkuY29tIiwic3ViIjoiYW5vbiIsImF1ZCI6ImJhemktZDhnZnB4czVvYjAxMGY2ZGMiLCJleHAiOjQwOTIwOTc3OTksImlhdCI6MTc4ODQxNDU5OSwibm9uY2UiOiI3dTBrUV9qWFJ4U2xmYmgxb3BuR1RnIiwiYXRfaGFzaCI6Ijd1MGtRX2pYUnhTbGZiaDFvcG5HVGciLCJuYW1lIjoiQW5vbnltb3VzIiwic2NvcGUiOiJhbm9ueW1vdXMiLCJwcm9qZWN0X2lkIjoiYmF6aS1kOGdmcHhzNW9iMDEwZjZkYyIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.nkPZd_3HK29tuuxxQO26PX4O9RmnGQo0cEe5oLxp9NBrcWbVQ1IxC7G3jzK3ACdhHSSLzbFvO9P5xStTSkh4bayAk1W9LBIhSIyczZ88af5-LpPULgsdhlVGULBbPlL2q0BGDBa9A1xBZPQ9VdPTaEc4t-1_eenInP8ZUJdVDZ0Y4aKad1oiAVQfj6PPbYUVK35WzK268B-_HhEMlNANL380EIaHx5ZoHmZqOceyoA-epc-GFK_QiLg5qE_fS_9ysyFtONjbFOGSyCT5Sl5CyhTDcZxlsCONJTejX4BO49qT3i12iIzi4HuuLZyffHLs3C-WjwYtG27rZkIJkUdSbw';

// ── Node 最小适配器(仿 @cloudbase/adapter-rn 的 fetch 路径) ──

const mem = new Map();
const storage = {
  getItemSync: (k) => (mem.has(k) ? mem.get(k) : null),
  setItemSync: (k, v) => mem.set(k, v),
  removeItemSync: (k) => mem.delete(k),
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

class NodeRequest extends AbstractSDKRequest {
  async _fetch(url, method, data, headers, body) {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json', ...(headers || {}) },
      // SDK 契约:fetch 路径的 body 已由 SDK 预先 JSON.stringify(勿再序列化)
      body: body !== undefined ? body : data !== undefined ? JSON.stringify(data) : undefined,
    });
    let out = null;
    try {
      out = await res.json();
    } catch {
      out = await res.text();
    }
    return { data: out, statusCode: res.status, header: new Map() };
  }
  get(opts) { return this._fetch(opts.url, 'GET', opts.data, opts.headers); }
  post(opts) { return this._fetch(opts.url, 'POST', opts.data, opts.headers); }
  put(opts) { return this._fetch(opts.url, 'PUT', opts.data, opts.headers); }
  upload() { return Promise.reject(new Error('probe: upload 不支持')); }
  download(opts) { return Promise.resolve({ statusCode: 200, tempFilePath: opts.url }); }
  async fetch(opts) { return this._fetch(opts.url, opts.method || 'POST', opts.data, opts.headers, opts.body); }
}

class StubWS {
  constructor() { this.readyState = 3; }
  set onopen(v) { this._onopen = v; }
  set onmessage(v) { this._onmessage = v; }
  set onclose(v) { this._onclose = v; }
  set onerror(v) { this._onerror = v; }
  send() {}
  close() {}
}

const adapterModule = {
  genAdapter: () => ({
    root: globalThis,
    reqClass: NodeRequest,
    wsClass: StubWS,
    localStorage: storage,
    sessionStorage: storage,
    primaryStorage: StorageType.local,
    getAppSign: () => 'node-probe',
  }),
  isMatch: () => true,
  runtime: 'node',
};

// ── 主流程 ──

const app = cloudbase.init({ env: ENV, region: REGION, accessKey: ACCESS_KEY });
cloudbase.useAdapters(adapterModule);
const db = app.database();

function waitForCode() {
  console.log('验证码已发送,请把收到的验证码写入 /tmp/otp-code.txt');
  const start = Date.now();
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      try {
        const code = fs.readFileSync('/tmp/otp-code.txt', 'utf8').trim();
        if (/^\d{4,8}$/.test(code)) {
          clearInterval(timer);
          resolve(code);
        }
      } catch {}
      if (Date.now() - start > 300000) {
        clearInterval(timer);
        console.error('等待验证码超时(5 分钟)');
        process.exit(1);
      }
    }, 1000);
  });
}

async function main() {
  console.log('─ 发送验证码到', PHONE, '…');
  const sendRes = await app.auth.signInWithOtp({ phone: PHONE });
  if (sendRes?.error) {
    console.error('发送失败:', JSON.stringify(sendRes.error));
    process.exit(1);
  }
  const verifyFn = sendRes?.data?.verifyOtp;
  if (typeof verifyFn !== 'function') {
    console.error('未获得 verifyOtp 函数,data =', JSON.stringify(sendRes?.data));
    process.exit(1);
  }

  const code = await waitForCode();
  console.log('─ 校验验证码', code, '…');
  const verifyRes = await verifyFn({ token: code });
  if (verifyRes?.error) {
    console.error('校验失败:', JSON.stringify(verifyRes.error));
    process.exit(1);
  }
  console.log('─ verifyRes.data 结构:', JSON.stringify(verifyRes?.data, (k, v) => (k === 'session' ? '[session]' : v)).slice(0, 800));
  const user = verifyRes?.data?.user;
  // SDK 事实:验证响应 user 对象用 id 字段(不是 uid)
  const uid = user?.id ?? user?.uid;
  console.log('登录成功 uid =', uid, '| user 字段:', user ? Object.keys(user).join(', ') : '(无 user)');

  // [1] UserStats.set
  console.log('─ [1] UserStats.set(uid) …');
  try {
    const r = await db.collection('UserStats').doc(uid).set({
      uid,
      phone: PHONE,
      nickname: 'probe',
      annotationCount: 0,
      titleCount: 0,
      lastAnnotationAt: null,
      lastAnnotationDate: null,
      dailyCount: 0,
    });
    console.log('[1] ✅ set 成功:', JSON.stringify(r).slice(0, 120));
  } catch (e) {
    console.log('[1] ❌ set 失败:', JSON.stringify(e).slice(0, 400));
  }

  // [2] Post.add(auth != null 规则隔离测试)
  console.log('─ [2] Post.add(隔离测试 auth 是否可见) …');
  try {
    const r = await db.collection('Post').add({
      authorUid: uid,
      authorNickname: 'probe',
      question: 'probe 规则测试帖',
      draft: { gender: 'male', baziBrief: '测试' },
      annotationCount: 0,
      status: 'published',
      createdAt: new Date(),
    });
    console.log('[2] ✅ add 成功:', JSON.stringify(r).slice(0, 120));
  } catch (e) {
    console.log('[2] ❌ add 失败:', JSON.stringify(e).slice(0, 400));
  }

  // [3] UserStats.add —— 对照:add 是否走 create 规则(与 set 区分)
  console.log('─ [3] UserStats.add(对照:create 规则是否对 add 生效) …');
  try {
    const r = await db.collection('UserStats').add({
      uid,
      phone: PHONE,
      nickname: 'probe-add',
      annotationCount: 0,
      titleCount: 0,
      lastAnnotationAt: null,
      lastAnnotationDate: null,
      dailyCount: 0,
    });
    console.log('[3] ✅ add 成功:', JSON.stringify(r).slice(0, 120));
  } catch (e) {
    console.log('[3] ❌ add 失败:', JSON.stringify(e).slice(0, 400));
  }

  // [4] UserStats.set —— 重试(与 [3] 对比定位 set 的规则路由)
  console.log('─ [4] UserStats.set(重试) …');
  try {
    const r = await db.collection('UserStats').doc(uid).set({
      uid,
      phone: PHONE,
      nickname: 'probe-set',
      annotationCount: 0,
      titleCount: 0,
      lastAnnotationAt: null,
      lastAnnotationDate: null,
      dailyCount: 0,
    });
    console.log('[4] ❌ set 意外成功(预期被拒):', JSON.stringify(r).slice(0, 120));
  } catch (e) {
    console.log('[4] ✅ set 按预期被拒:', JSON.stringify(e).slice(0, 160));
  }

  // [5] UserStats.add 显式 _id —— 验证「add 指定文档 id」走 create 规则
  console.log('─ [5] UserStats.add(_id=uid)(目标方案) …');
  try {
    const r = await db.collection('UserStats').add({
      _id: uid,
      uid,
      phone: PHONE,
      nickname: 'probe-add-id',
      annotationCount: 0,
      titleCount: 0,
      lastAnnotationAt: null,
      lastAnnotationDate: null,
      dailyCount: 0,
    });
    console.log('[5] ✅ add(_id) 成功:', JSON.stringify(r).slice(0, 160));
  } catch (e) {
    console.log('[5] ❌ add(_id) 失败:', JSON.stringify(e).slice(0, 200));
  }

  // [6] UserStats 读:doc(uid).get() —— 验证「查询子集要求」假设(预期被拒)
  console.log('─ [6] UserStats.doc(uid).get()(按 id 直读,预期被拒) …');
  try {
    const r = await db.collection('UserStats').doc(uid).get();
    console.log('[6] ✅ 直读成功(意外):', JSON.stringify(r?.data).slice(0, 120));
  } catch (e) {
    console.log('[6] ❌ 直读被拒(符合假设):', JSON.stringify(e).slice(0, 160));
  }

  // [7] UserStats 读:where({uid}) —— 查询含规则引用字段(预期成功)
  console.log('─ [7] UserStats.where({uid}).get()(预期成功) …');
  try {
    const r = await db.collection('UserStats').where({ uid }).get();
    const d = Array.isArray(r?.data) ? r.data : [];
    console.log('[7] ✅ where 读成功:', d.length, '条,', JSON.stringify(d[0] ?? null).slice(0, 120));
  } catch (e) {
    console.log('[7] ❌ where 读失败:', JSON.stringify(e).slice(0, 160));
  }

  // [8] UserStats 更新:doc(uid).update —— 验证 update 规则(预期成功)
  console.log('─ [8] UserStats.doc(uid).update(预期被拒) …');
  try {
    const r = await db.collection('UserStats').doc(uid).update({ nickname: 'probe-updated' });
    console.log('[8] ✅ update 意外成功:', JSON.stringify(r).slice(0, 120));
  } catch (e) {
    console.log('[8] ❌ update 按预期被拒:', JSON.stringify(e).slice(0, 160));
  }

  // [9] UserStats.where({uid}).update —— 查询含规则字段的更新(目标方案,预期成功)
  console.log('─ [9] UserStats.where({uid}).update(目标方案,预期成功) …');
  try {
    const r = await db.collection('UserStats').where({ uid }).update({ nickname: 'probe-where-upd' });
    console.log('[9] ✅ where-update 成功:', JSON.stringify(r).slice(0, 160));
  } catch (e) {
    console.log('[9] ❌ where-update 失败:', JSON.stringify(e).slice(0, 200));
  }

  // [10] UserStats.where({uid}).remove —— 查询含规则字段的删除(注销账号用,预期成功)
  console.log('─ [10] UserStats.where({uid}).remove(预期成功) …');
  try {
    const r = await db.collection('UserStats').where({ uid }).remove();
    console.log('[10] ✅ where-remove 成功:', JSON.stringify(r).slice(0, 160));
  } catch (e) {
    console.log('[10] ❌ where-remove 失败:', JSON.stringify(e).slice(0, 200));
  }

  console.log('─ 探针完成');
  process.exit(0);
}

main().catch((e) => {
  console.error('探针异常:', e);
  process.exit(1);
});
