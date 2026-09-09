// ─────────────────────────────────────────────────────────────
// 社区业务 API 封装层(界面层唯一入口,只认 community/ 的 DTO)
//
// 后端:腾讯云开发 CloudBase(文档型数据库 + 内置手机号 OTP 认证)。
// 内部全部 SDK 调用集中在本文件;错误统一归一化为
// CommunityError(code + 中文文案)。将来迁移后端只重写本文件。
//
// 计数一致性:annotationCount/titleCount/dailyCount 全部走
// db.command.inc 服务端原子自增;防刷判断(antiSpam)在客户端,
// 被绕过后果可控(举报兜底,风险 R3/R4)。
// 权限由 CloudBase 安全规则保证(见 docs/社区上线手册):
//   Post/Annotation 全员可读、仅登录用户可写(写时校验 authorUid);
//   UserStats 仅本人可读写。
// ─────────────────────────────────────────────────────────────

import { getApp, ensureInit } from './cloudbase';
import { maskPhone, defaultNickname } from '@/community/mask';
import { titleForCount } from '@/community/titles';
import { evaluateDraft, nextDaily } from '@/community/antiSpam';
import type { AntiSpamViolation } from '@/community/antiSpam';
import { containsSensitive } from '@/community/sensitiveWords';
import { PostDraftSchema, QuestionSchema } from '@/community/schemas';
import type { ReportReason } from '@/community/schemas';
import { todayEast8 } from '@/community/east8';
import type {
  AuthUser,
  PostDTO,
  AnnotationDTO,
  UserStatsDTO,
  PostDraft,
} from '@/community';

export const PAGE_SIZE = 20;

/** 归一化错误:code 供程序判断,message 为可直接展示的中文文案 */
export class CommunityError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'CommunityError';
    this.code = code;
  }
}

// ── 局部结构类型(js-sdk 未导出深路径类型,按需声明最小形状) ──

interface CloudbaseUserLike {
  uid?: string;
  name?: string;
  displayName?: string;
  update?: (profile: { name?: string }) => Promise<unknown>;
}

interface CloudbaseErrorLike {
  code?: string;
  message?: string;
  error?: CloudbaseErrorLike;
}

/** OTP 验证句柄(signInWithOtp 返回,复用其 verifyOtp,勿重复发送) */
export interface VerificationHandle {
  verifyOtp: (params: { token: string | number }) => Promise<{
    data?: { user?: CloudbaseUserLike } | null;
    error?: CloudbaseErrorLike | null;
  }>;
}

interface PostDoc {
  _id?: string;
  authorUid: string;
  authorNickname: string;
  question: string;
  draft: PostDraft;
  annotationCount: number;
  status: string;
  createdAt?: unknown;
}

interface AnnotationDoc {
  _id?: string;
  postId: string;
  authorUid: string;
  authorNickname: string;
  authorTitle: string | null;
  content: string;
  status: string;
  createdAt?: unknown;
}

interface UserStatsDoc {
  _id?: string;
  uid: string;
  phone: string;
  nickname: string;
  annotationCount: number;
  titleCount: number;
  lastAnnotationAt: Date | null;
  lastAnnotationDate: string | null;
  dailyCount: number;
}

// ── 会话状态(登录/恢复/退出时由 AuthContext 同步) ──

let currentUid: string | null = null;

export function setCurrentUid(uid: string | null): void {
  currentUid = uid;
}

export function requireUid(): string {
  if (!currentUid) throw new CommunityError('UNAUTHENTICATED', '请先登录');
  return currentUid;
}

// ── 工具 ──

function mapError(e: unknown): CommunityError {
  const err = e as CloudbaseErrorLike | undefined;
  const inner = err?.error ?? err;
  const code = String(inner?.code ?? '');
  const raw = inner?.message || '网络异常,请稍后重试';
  switch (code) {
    case 'CAPTCHA_REQUIRED':
      return new CommunityError('CAPTCHA_REQUIRED', '需要图形验证码');
    case 'RATE_LIMIT_EXCEEDED':
    case 'RATE_LIMITED':
      return new CommunityError('RATE_LIMITED', '操作过于频繁,请稍后再试');
    case 'VERIFICATION_CODE_INVALID':
      return new CommunityError('CODE_INVALID', '验证码错误');
    case 'VERIFICATION_CODE_EXPIRED':
      return new CommunityError('CODE_EXPIRED', '验证码已过期,请重新获取');
    case 'PERMISSION_DENIED':
      return new CommunityError('PERMISSION_DENIED', '没有操作权限');
    case 'UNAUTHENTICATED':
      return new CommunityError('UNAUTHENTICATED', '请先登录');
    default:
      return new CommunityError(code || 'NETWORK', raw);
  }
}

function violationMessage(v: AntiSpamViolation): string {
  switch (v) {
    case 'TOO_SHORT':
      return '批注至少 10 个字';
    case 'TOO_LONG':
      return '批注最多 500 字';
    case 'DUPLICATE':
      return '请不要重复发布相同内容';
    case 'COOLDOWN':
      return '操作太频繁,请稍后再试';
    case 'DAILY_LIMIT':
      return '今日批注已达上限,明天再来吧';
  }
}

function dateISO(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return '';
}

/** doc().get() 的 data 为数组形态(见 SDK 类型文档:GetRes 包含 data 数组),取首元素 */
function firstDoc<T>(raw: unknown): T | null {
  if (Array.isArray(raw)) return (raw[0] as T | undefined) ?? null;
  return (raw as T | null) ?? null;
}

// ── 认证 ──

/** 发送登录验证码,返回验证句柄(登录时复用,勿重复调用本函数) */
export async function sendSmsCode(phone: string): Promise<VerificationHandle> {
  ensureInit();
  try {
    const res = await getApp().auth.signInWithOtp({ phone });
    if (res?.error) throw mapError(res.error);
    const handle = res?.data?.verifyOtp;
    if (!handle) throw new CommunityError('SMS_FAILED', '验证码发送失败,请稍后重试');
    return handle as unknown as VerificationHandle;
  } catch (e) {
    throw mapError(e);
  }
}

/** 用验证码登录(注册合一);首次登录落 UserStats(phone/nickname 快照) */
export async function loginWithCode(
  phone: string,
  handle: VerificationHandle,
  code: string,
): Promise<AuthUser> {
  ensureInit();
  try {
    const res = await handle.verifyOtp({ token: code });
    if (res?.error) throw mapError(res.error);
    const user = res?.data?.user as CloudbaseUserLike | undefined;
    if (!user?.uid) throw new CommunityError('CODE_INVALID', '验证码错误');

    const nickname = user.name || user.displayName || '';
    if (!nickname) {
      await user.update?.({ name: defaultNickname(phone) }).catch(() => {});
    }
    await upsertUserStats(phone, nickname || defaultNickname(phone));
    setCurrentUid(user.uid);
    return {
      id: user.uid,
      phoneMasked: maskPhone(phone),
      nickname: nickname || defaultNickname(phone),
    };
  } catch (e) {
    throw mapError(e);
  }
}

/** 启动时恢复会话(适配器从 MMKV 恢复,不触网;UserStats 供昵称/手机号) */
export async function restoreSession(): Promise<AuthUser | null> {
  ensureInit();
  try {
    const state = await getApp().auth.getLoginState();
    const user = state?.user as CloudbaseUserLike | undefined;
    if (!user?.uid) return null;
    const stats = await readUserStats(user.uid).catch(() => null);
    setCurrentUid(user.uid);
    return {
      id: user.uid,
      phoneMasked: maskPhone(stats?.phone ?? ''),
      nickname: stats?.nickname || user.name || user.displayName || '命友',
    };
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  setCurrentUid(null);
  try {
    await getApp().auth.signOut();
  } catch {
    // 本地登出失败不阻塞 UI
  }
}

/**
 * 注销账号(两步):
 *   requestAccountDeletionCode() — 向本人手机号发送验证码
 *   deleteAccount(code)          — verify → sudo → 数据匿名化 → deleteMe
 */
let deletionVerificationId: string | null = null;

export async function requestAccountDeletionCode(): Promise<void> {
  ensureInit();
  const uid = requireUid();
  try {
    const stats = await readUserStats(uid);
    if (!stats?.phone) throw new CommunityError('NO_PHONE', '未找到账号手机号,请重新登录后重试');
    // 错误以异常抛出,直接取响应字段
    const res = await getApp().auth.getVerification({ phone_number: stats.phone });
    deletionVerificationId = res?.verification_id ?? null;
  } catch (e) {
    throw mapError(e);
  }
}

export async function deleteAccount(code: string): Promise<void> {
  ensureInit();
  const uid = requireUid();
  try {
    if (!deletionVerificationId) {
      throw new CommunityError('CODE_EXPIRED', '请先获取注销验证码');
    }
    const verifyRes = await getApp().auth.verify({
      verification_id: deletionVerificationId,
      verification_code: code,
    });
    const verificationToken = verifyRes?.verification_token;
    if (!verificationToken) throw new CommunityError('CODE_INVALID', '验证码错误');

    const sudoRes = await getApp().auth.sudo({ verification_token: verificationToken });
    const sudoToken = sudoRes?.sudo_token;
    if (!sudoToken) throw new CommunityError('DELETE_FAILED', '注销校验失败,请重试');

    // 数据匿名化:帖子/批注的作者昵称替换为「已注销用户」
    await getApp()
      .database()
      .collection('Post')
      .where({ authorUid: uid })
      .update({ authorNickname: '已注销用户' })
      .catch(() => {});
    await getApp()
      .database()
      .collection('Annotation')
      .where({ authorUid: uid })
      .update({ authorNickname: '已注销用户' })
      .catch(() => {});
    await getApp().database().collection('UserStats').doc(uid).remove().catch(() => {});

    // 错误以异常抛出;成功即完成账号删除
    await getApp().auth.deleteMe({ sudo_token: sudoToken });
    setCurrentUid(null);
  } catch (e) {
    throw mapError(e);
  }
}

/** 图形验证码换取 captcha_token(UI 桥收集输入后调用) */
export async function verifyCaptcha(params: {
  token: string;
  key: string;
}): Promise<{ captcha_token: string; expires_in: number }> {
  ensureInit();
  return getApp().auth.verifyCaptchaData(params);
}

// ── UserStats(uid 即文档 id) ──

function statsRef() {
  return getApp().database().collection('UserStats');
}

async function readUserStats(uid: string): Promise<UserStatsDoc | null> {
  const res = await statsRef().doc(uid).get();
  const data = firstDoc<UserStatsDoc & { _id?: string }>(res?.data);
  if (!data || !data.uid) return null;
  return data;
}

async function upsertUserStats(phone: string, nickname: string): Promise<void> {
  const uid = requireUid();
  const existing = await readUserStats(uid).catch(() => null);
  if (existing) {
    await statsRef().doc(uid).update({ phone, nickname });
    return;
  }
  await statsRef().doc(uid).set({
    uid,
    phone,
    nickname,
    annotationCount: 0,
    titleCount: 0,
    lastAnnotationAt: null,
    lastAnnotationDate: null,
    dailyCount: 0,
  });
}

function toUserStatsDTO(doc: UserStatsDoc): UserStatsDTO {
  return {
    annotationCount: doc.annotationCount ?? 0,
    titleCount: doc.titleCount ?? 0,
    lastAnnotationAt: doc.lastAnnotationAt ? dateISO(doc.lastAnnotationAt) : null,
    lastAnnotationDate: doc.lastAnnotationDate ?? null,
    dailyCount: doc.dailyCount ?? 0,
  };
}

export async function getMyStats(): Promise<UserStatsDTO> {
  ensureInit();
  const uid = requireUid();
  try {
    const doc = await readUserStats(uid);
    if (!doc) throw new CommunityError('NO_STATS', '统计数据尚未初始化');
    return toUserStatsDTO(doc);
  } catch (e) {
    throw mapError(e);
  }
}

// ── 帖子 ──

function toPostDTO(doc: PostDoc): PostDTO {
  return {
    id: doc._id ?? '',
    author: {
      id: doc.authorUid,
      nickname: doc.authorNickname || '命友',
      title: null, // MVP:帖子作者称号不实时映射,批注作者称号用写入快照
    },
    draft: doc.draft,
    question: doc.question,
    annotationCount: doc.annotationCount ?? 0,
    createdAt: dateISO(doc.createdAt),
  };
}

function postsRef() {
  return getApp().database().collection('Post');
}

export async function fetchPosts(page: number, pageSize: number = PAGE_SIZE): Promise<PostDTO[]> {
  ensureInit();
  try {
    const res = await postsRef()
      .where({ status: 'published' })
      .orderBy('createdAt', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get();
    const docs = res?.data as unknown as PostDoc[] | undefined;
    return (docs ?? []).map(toPostDTO);
  } catch (e) {
    throw mapError(e);
  }
}

export async function fetchPost(postId: string): Promise<PostDTO> {
  ensureInit();
  try {
    const res = await postsRef().doc(postId).get();
    const doc = firstDoc<PostDoc & { _id: string }>(res?.data);
    if (!doc) throw new CommunityError('NOT_FOUND', '帖子不存在或已删除');
    return toPostDTO(doc);
  } catch (e) {
    throw mapError(e);
  }
}

export async function createPost(draft: PostDraft, question: string): Promise<PostDTO> {
  ensureInit();
  const uid = requireUid();
  // 白名单 strip:任何不在 PostDraft 白名单的键在此被剥除(脱敏双保险)
  const parsedDraft = PostDraftSchema.parse(draft);
  const parsedQuestion = QuestionSchema.parse(question);
  try {
    const myStats = await readUserStats(uid).catch(() => null);
    const res = await postsRef().add({
      authorUid: uid,
      authorNickname: myStats?.nickname || '命友',
      question: parsedQuestion,
      draft: parsedDraft,
      annotationCount: 0,
      status: 'published',
      createdAt: new Date(),
    });
    return {
      id: res?.id ?? '',
      author: { id: uid, nickname: myStats?.nickname || '命友', title: null },
      draft: parsedDraft,
      question: parsedQuestion,
      annotationCount: 0,
      createdAt: new Date().toISOString(),
    };
  } catch (e) {
    throw mapError(e);
  }
}

export async function deletePost(postId: string): Promise<void> {
  ensureInit();
  const uid = requireUid();
  try {
    const res = await postsRef().doc(postId).get();
    const doc = firstDoc<PostDoc & { _id: string }>(res?.data);
    if (!doc) throw new CommunityError('NOT_FOUND', '帖子不存在或已删除');
    if (doc.authorUid !== uid) throw new CommunityError('FORBIDDEN', '只能删除自己发布的帖子');
    await postsRef().doc(postId).remove();
  } catch (e) {
    throw mapError(e);
  }
}

export async function fetchMyPosts(): Promise<PostDTO[]> {
  ensureInit();
  const uid = requireUid();
  try {
    const res = await postsRef()
      .where({ authorUid: uid })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const docs = res?.data as unknown as PostDoc[] | undefined;
    return (docs ?? []).map(toPostDTO);
  } catch (e) {
    throw mapError(e);
  }
}

// ── 批注 ──

function toAnnotationDTO(doc: AnnotationDoc): AnnotationDTO {
  return {
    id: doc._id ?? '',
    postId: doc.postId,
    author: {
      id: doc.authorUid,
      nickname: doc.authorNickname || '命友',
      title: doc.authorTitle ?? null,
    },
    content: doc.content,
    createdAt: dateISO(doc.createdAt),
  };
}

function annotationsRef() {
  return getApp().database().collection('Annotation');
}

export async function fetchAnnotations(
  postId: string,
  page: number,
  pageSize: number = PAGE_SIZE,
): Promise<AnnotationDTO[]> {
  ensureInit();
  try {
    const res = await annotationsRef()
      .where({ postId, status: 'published' })
      .orderBy('createdAt', 'asc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get();
    const docs = res?.data as unknown as AnnotationDoc[] | undefined;
    return (docs ?? []).map(toAnnotationDTO);
  } catch (e) {
    throw mapError(e);
  }
}

export async function fetchMyAnnotations(): Promise<AnnotationDTO[]> {
  ensureInit();
  const uid = requireUid();
  try {
    const res = await annotationsRef()
      .where({ authorUid: uid })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const docs = res?.data as unknown as AnnotationDoc[] | undefined;
    return (docs ?? []).map(toAnnotationDTO);
  } catch (e) {
    throw mapError(e);
  }
}

/**
 * 批注提交管线:
 *   敏感词 → 防刷评估(antiSpam)→ UserStats 原子自增 → 写批注(称号快照)
 */
export async function createAnnotation(postId: string, content: string): Promise<AnnotationDTO> {
  ensureInit();
  const uid = requireUid();

  const hit = containsSensitive(content);
  if (hit) {
    throw new CommunityError('SENSITIVE', '内容包含不适宜词汇,请修改后重试');
  }

  // 并行抓取防刷上下文:目标帖 / 我的上一条批注 / 我是否已在该帖批注过 / 我的统计
  const [post, lastAnnotation, alreadyAnnotated, stats] = await Promise.all([
    (async () => {
      const res = await postsRef().doc(postId).get();
      const doc = firstDoc<PostDoc & { _id: string }>(res?.data);
      if (!doc) throw new CommunityError('NOT_FOUND', '帖子不存在或已删除');
      return doc;
    })(),
    (async () => {
      const res = await annotationsRef()
        .where({ authorUid: uid })
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      const docs = res?.data as unknown as AnnotationDoc[] | undefined;
      return docs?.[0] ?? null;
    })(),
    (async () => {
      const res = await annotationsRef()
        .where({ postId, authorUid: uid })
        .limit(1)
        .get();
      const docs = res?.data as unknown as AnnotationDoc[] | undefined;
      return (docs?.length ?? 0) > 0;
    })(),
    (async () => {
      const doc = await readUserStats(uid);
      if (!doc) throw new CommunityError('NO_STATS', '统计数据尚未初始化');
      return doc;
    })(),
  ]);

  const today = todayEast8();
  const evaluation = evaluateDraft({
    content,
    lastContent: lastAnnotation?.content ?? null,
    lastAt: lastAnnotation?.createdAt ? new Date(lastAnnotation.createdAt as string).getTime() : null,
    now: Date.now(),
    dailyCount: stats.dailyCount ?? 0,
    lastDate: stats.lastAnnotationDate ?? null,
    today,
    postAuthorId: post.authorUid,
    myId: uid,
    alreadyAnnotated,
  });

  if (!evaluation.ok) {
    throw new CommunityError('ANTI_SPAM', violationMessage(evaluation.violations[0]));
  }

  // 服务端原子自增(日限键由客户端按东八区日期重置,风险 R4)
  const daily = nextDaily({
    lastDate: stats.lastAnnotationDate ?? null,
    today,
    dailyCount: stats.dailyCount ?? 0,
  });
  const statsUpdate: Record<string, unknown> = {
    annotationCount: getApp().database().command.inc(1),
    lastAnnotationAt: new Date(),
    lastAnnotationDate: daily.date,
    dailyCount: daily.count,
  };
  if (evaluation.titleEligible) {
    statsUpdate.titleCount = getApp().database().command.inc(1);
  }
  await statsRef().doc(uid).update(statsUpdate);

  // 帖子批注计数(失败不阻塞批注本身)
  await postsRef()
    .doc(postId)
    .update({ annotationCount: getApp().database().command.inc(1) })
    .catch(() => {});

  const myTitle = titleForCount(stats.titleCount + (evaluation.titleEligible ? 1 : 0)).name;
  const annRes = await annotationsRef().add({
    postId,
    authorUid: uid,
    authorNickname: stats.nickname || '命友',
    authorTitle: myTitle,
    content: content.trim(),
    status: 'published',
    createdAt: new Date(),
  });
  return {
    id: annRes?.id ?? '',
    postId,
    author: { id: uid, nickname: stats.nickname || '命友', title: myTitle },
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

// ── 举报 ──

export async function createReport(args: {
  targetType: 'Post' | 'Annotation' | 'User';
  targetId: string;
  reason: ReportReason;
  detail?: string;
}): Promise<void> {
  ensureInit();
  const uid = requireUid();
  try {
    await getApp().database().collection('Report').add({
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      detail: args.detail ?? '',
      reporterUid: uid,
      status: 'pending',
      createdAt: new Date(),
    });
  } catch (e) {
    throw mapError(e);
  }
}
