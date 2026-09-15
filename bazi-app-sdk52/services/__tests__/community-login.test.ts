// ─────────────────────────────────────────────────────────────
// 登录流回归测试(services/community.ts,cloudbase 层用 vi.mock 替身)
//
// 锁定的事故:loginWithCode 曾在 upsertUserStats(内部 requireUid())
// 之后才 setCurrentUid —— 真机全新安装首登时 currentUid 为 null,
// 必抛「请先登录」(UNAUTHENTICATED)。修复:验证通过后先落登录态,
// 且 upsertUserStats 显式接收 uid,不再依赖模块级状态。
// ─────────────────────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

// vi.hoisted:mock 工厂先于 import 执行,状态定义必须提级
const mocks = vi.hoisted(() => {
  type Doc = Record<string, unknown> & { _id?: string };

  const statsStore = new Map<string, Doc>();

  const statsCollection = {
    where: (query: Record<string, unknown>) => ({
      get: vi.fn(async () => {
        const doc = [...statsStore.values()].find((d) => d.uid === query.uid);
        return { data: doc ? [doc] : [] };
      }),
      update: vi.fn(async (patch: Record<string, unknown>) => {
        const doc = [...statsStore.values()].find((d) => d.uid === query.uid);
        if (doc) Object.assign(doc, patch);
      }),
    }),
    add: vi.fn(async (doc: Doc) => {
      const id = String(doc._id ?? doc.uid);
      statsStore.set(id, doc);
      return { id };
    }),
  };

  const emptyCollection = {
    where: () => ({ get: vi.fn(async () => ({ data: [] })), update: vi.fn(async () => {}) }),
    add: vi.fn(async (d: Doc) => ({ id: d._id ?? 'gen-id' })),
    doc: () => ({ get: vi.fn(async () => ({ data: [] })), update: vi.fn(async () => {}) }),
  };

  const fakeApp = {
    auth: {
      signInWithOtp: vi.fn() as Mock,
      getLoginState: vi.fn(async () => null) as Mock,
      signOut: vi.fn(async () => {}),
    },
    database: () => ({
      command: { inc: (n: number) => ({ $inc: n }) },
      collection: (name: string) => (name === 'UserStats' ? statsCollection : emptyCollection),
    }),
  };

  return { statsStore, fakeApp };
});

vi.mock('../cloudbase', () => ({
  ensureInit: () => {},
  getApp: () => mocks.fakeApp,
}));

import {
  sendSmsCode,
  loginWithCode,
  restoreSession,
  logout,
  getMyStats,
  setCurrentUid,
  CommunityError,
} from '../community';

/** 构造 OTP 验证句柄:signInWithOtp 返回 data.verifyOtp 函数(实测的 SDK 形态) */
function mockOtpUser(user: { id: string; name?: string; update?: Mock }) {
  const verifyOtp = vi.fn(async () => ({ data: { user } }));
  mocks.fakeApp.auth.signInWithOtp.mockResolvedValue({ data: { verifyOtp } });
  return verifyOtp;
}

beforeEach(() => {
  setCurrentUid(null);
  mocks.statsStore.clear();
  vi.clearAllMocks();
});

describe('登录流(首登 / 重登 / 退出)', () => {
  it('真机首登回归:currentUid 为空时登录必须成功,不得抛「请先登录」', async () => {
    const verifyOtp = mockOtpUser({ id: 'uid-first', name: '13800138000' });

    const handle = await sendSmsCode('13800138000');
    const user = await loginWithCode('13800138000', handle, '123456');

    expect(verifyOtp).toHaveBeenCalledWith({ token: '123456' });
    expect(user.id).toBe('uid-first');
    // OTP 会把 user.name 自动填成手机号:不能作公开昵称,必须回落默认打码昵称
    expect(user.nickname).toBe('命友·138****8000');

    // 登录后 currentUid 已就位:需要登录态的接口立即可用
    const stats = await getMyStats();
    expect(stats.annotationCount).toBe(0);
    expect(stats.titleCount).toBe(0);

    // UserStats 落库:文档 id 即本人 uid(修复前根本走不到这一步)
    const docs = [...mocks.statsStore.values()];
    expect(docs).toHaveLength(1);
    expect(docs[0]._id).toBe('uid-first');
    expect(docs[0].uid).toBe('uid-first');
    expect(docs[0].phone).toBe('13800138000');
    // 隐私红线:明文手机号绝不能以昵称形式入云
    expect(docs[0].nickname).toBe('命友·138****8000');
  });

  it('新用户首登:user.name 为空时使用默认打码昵称', async () => {
    mockOtpUser({ id: 'uid-empty-name' });

    const handle = await sendSmsCode('13800138000');
    const user = await loginWithCode('13800138000', handle, '123456');

    expect(user.nickname).toBe('命友·138****8000');
    const docs = [...mocks.statsStore.values()];
    expect(docs[0].nickname).toBe('命友·138****8000');
  });

  it('重登自愈:已有统计文档的昵称优先,不被 auth 档案的手机号覆盖', async () => {
    mocks.statsStore.set('uid-old', {
      _id: 'uid-old',
      uid: 'uid-old',
      phone: '13800138000',
      nickname: '命理客',
      annotationCount: 0,
      titleCount: 0,
    });
    mockOtpUser({ id: 'uid-old', name: '13800138000' });

    const handle = await sendSmsCode('13800138000');
    const user = await loginWithCode('13800138000', handle, '123456');

    expect(user.nickname).toBe('命理客');
    const doc = [...mocks.statsStore.values()][0];
    expect(doc.nickname).toBe('命理客');
  });

  it('退出登录后:需要登录态的接口抛 UNAUTHENTICATED', async () => {
    mockOtpUser({ id: 'uid-out', name: '13800138000' });
    const handle = await sendSmsCode('13800138000');
    await loginWithCode('13800138000', handle, '123456');

    await logout();
    const err = await getMyStats().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(CommunityError);
    expect((err as CommunityError).code).toBe('UNAUTHENTICATED');
  });
});

describe('restoreSession(会话恢复)', () => {
  it('统计文档缺失且档案名为手机号:补建昵称用默认打码,不泄漏明文手机号', async () => {
    mocks.fakeApp.auth.getLoginState.mockResolvedValue({
      user: { id: 'uid-restore', name: '13900139000', phone: '13900139000' },
    });

    const user = await restoreSession();

    expect(user?.id).toBe('uid-restore');
    expect(user?.nickname).toBe('命友·139****9000');
    const docs = [...mocks.statsStore.values()];
    expect(docs[0].uid).toBe('uid-restore');
    expect(docs[0].nickname).toBe('命友·139****9000');
    expect(docs[0].nickname).not.toContain('13900139000');
  });

  it('统计文档存在:昵称以统计文档为准', async () => {
    mocks.statsStore.set('uid-keep', {
      _id: 'uid-keep',
      uid: 'uid-keep',
      phone: '13900139000',
      nickname: '玄机子',
    });
    mocks.fakeApp.auth.getLoginState.mockResolvedValue({
      user: { id: 'uid-keep', name: '13900139000', phone: '13900139000' },
    });

    const user = await restoreSession();

    expect(user?.nickname).toBe('玄机子');
  });

  it('无会话返回 null', async () => {
    mocks.fakeApp.auth.getLoginState.mockResolvedValue(null);
    expect(await restoreSession()).toBeNull();
  });
});
