// ─────────────────────────────────────────────────────────────
// CloudBase 初始化(单例)+ MMKV 冒烟测试 + 图形验证码 UI 桥
//
// 所有 CloudBase SDK 调用只允许出现在本文件与 services/community.ts,
// 界面层一律经 community.ts 的 DTO 接口。将来迁移后端只换这一层。
//
// 运行环境兼容:Expo Go 不含 react-native-mmkv 原生模块,且该包在
// import 阶段就会抛错(Cannot assign to property 'default')。因此
// adapter 与 MMKV 一律动态 require + try/catch:Expo Go 下排盘等
// 纯本地功能正常,社区功能降级为「当前环境不支持」提示;dev build /
// 真机上原生模块齐全,社区功能完整可用。
//
// 图形验证码:CloudBase 风控触发时会对发验证码/登录返回 CAPTCHA_REQUIRED,
// SDK 要求注册 setCaptchaHandler(适配器内置流程)。本文件把 challenge
// 转发给 UI 桥(LoginScreen 注册),UI 弹出验证码图、用户输入后经
// community.ts 的 verifyCaptcha 换取 captcha_token 回填。
// ─────────────────────────────────────────────────────────────

import { CLOUDBASE_CONFIG } from './cloudbase-config';
import Constants from 'expo-constants';

// 类型仅作编译期引用(不产生运行时 import)
import type cloudbaseType from '@cloudbase/js-sdk';
type SDKNamespace = typeof cloudbaseType;

/**
 * Expo Go 检测:appOwnership === 'expo' 表示运行在 Expo Go 里。
 * Expo Go 不含 MMKV 原生模块且旧架构下 mmkv 会 console.error 触发
 * LogBox 红屏,因此 Expo Go 下完全跳过 SDK/适配器加载,零报错降级;
 * dev build(appOwnership === 'standalone')与真机上正常加载。
 */
const IS_EXPO_GO = Constants.appOwnership === 'expo';

let sdk: SDKNamespace | null = null;
let app: ReturnType<SDKNamespace['init']> | null = null;

/** 适配器加载状态:null=未尝试,true=成功,false=当前环境不可用 */
let adapterReady: boolean | null = null;

/** 图形验证码 UI 桥(由 LoginScreen 注册) */
export interface CaptchaChallenge {
  /** Base64 编码的验证码图片 */
  captchaData: string;
  state: string;
  token: string;
}

export type CaptchaUIBridge = (
  challenge: CaptchaChallenge,
) => Promise<{ captcha_token: string; expires_in: number } | null>;

let captchaBridge: CaptchaUIBridge | null = null;

export function setCaptchaUIBridge(fn: CaptchaUIBridge | null): void {
  captchaBridge = fn;
}

/** 尝试动态加载 SDK 与 RN 适配器(含 MMKV),失败即当前环境不支持社区功能 */
function tryLoadAdapter(): boolean {
  if (adapterReady !== null) return adapterReady;
  if (IS_EXPO_GO) {
    console.log('[community] Expo Go 环境,社区功能降级(不加载 SDK/MMKV)');
    adapterReady = false;
    return false;
  }
  try {
    // 动态 require:模块工厂执行阶段可能抛错,此处捕获降级
    sdk = require('@cloudbase/js-sdk') as SDKNamespace;
    const adapterMod = require('@cloudbase/adapter-rn') as {
      default: Parameters<SDKNamespace['useAdapters']>[0];
      setCaptchaHandler: (handler: unknown) => void;
    };
    adapterMod.setCaptchaHandler((payload: {
      captchaData: string;
      state: string;
      token: string;
      resolve: (result: unknown) => void;
    }) => {
      if (!captchaBridge) {
        console.warn('[community] 未注册图形验证码 UI 桥,验证码流程终止');
        payload.resolve(null);
        return;
      }
      captchaBridge({
        captchaData: payload.captchaData,
        state: payload.state,
        token: payload.token,
      })
        .then((result) => payload.resolve(result ?? null))
        .catch(() => payload.resolve(null));
    });
    sdk!.useAdapters(adapterMod.default);
    adapterReady = true;
  } catch (e) {
    console.warn('[community] CloudBase RN 适配器加载失败(当前环境不支持社区功能):', e);
    adapterReady = false;
  }
  return adapterReady;
}

/** 幂等初始化;当前环境不支持社区功能时抛出(Expo Go 降级路径) */
export function ensureInit(): ReturnType<SDKNamespace['init']> {
  if (!app) {
    if (!tryLoadAdapter() || !sdk) {
      throw new Error('当前运行环境不支持社区功能,请在开发构建或真机上使用');
    }
    app = sdk.init({
      env: CLOUDBASE_CONFIG.env,
      region: CLOUDBASE_CONFIG.region,
      accessKey: CLOUDBASE_CONFIG.accessKey,
    });
  }
  return app;
}

/** 获取全局 app 实例(所有数据库/认证入口) */
export function getApp(): ReturnType<SDKNamespace['init']> {
  return ensureInit();
}

// ── 存储冒烟测试 ──

interface MMKVLike {
  set(key: string, value: string): void;
  getString(key: string): string | undefined;
  delete(key: string): void;
}

let smokeStorage: MMKVLike | null = null;

function getSmokeStorage(): MMKVLike | null {
  if (IS_EXPO_GO) return null; // Expo Go 无原生模块,直接降级(不触发 mmkv 内部报错)
  if (!smokeStorage) {
    try {
      // 动态 require:与适配器同理,失败时捕获降级
      const mmkvModule = require('react-native-mmkv') as {
        MMKV: new (config: { id: string }) => MMKVLike;
      };
      smokeStorage = new mmkvModule.MMKV({ id: 'community-smoke' });
    } catch (e) {
      console.warn('[community] MMKV 初始化失败(当前运行环境可能不支持):', e);
      smokeStorage = null;
    }
  }
  return smokeStorage;
}

/**
 * MMKV 冒烟测试:适配器用 MMKV 持久化登录态,
 * 失败时登录会话无法保存(LoginScreen 会提示)。
 */
export function runStorageSmokeTest(): boolean {
  try {
    const storage = getSmokeStorage();
    if (!storage) return false;
    storage.set('__smoke__', 'ok');
    const value = storage.getString('__smoke__');
    storage.delete('__smoke__');
    return value === 'ok';
  } catch (e) {
    console.warn('[community] MMKV 冒烟测试失败:', e);
    return false;
  }
}
