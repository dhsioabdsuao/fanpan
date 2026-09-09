// ─────────────────────────────────────────────────────────────
// 登录态上下文:会话恢复 / 验证码登录(OTP 两段式)/ 退出 / 注销
// 所有认证操作经 services/community.ts,界面层不直接接触 SDK。
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '@/community';
import {
  sendSmsCode,
  loginWithCode,
  restoreSession,
  logout as logoutRemote,
  requestAccountDeletionCode as requestDeletionCode,
  deleteAccount as deleteAccountRemote,
  setCurrentUid,
} from '../services/community';
import type { VerificationHandle } from '../services/community';
import { runStorageSmokeTest } from '../services/cloudbase';

interface AuthContextValue {
  user: AuthUser | null;
  /** 启动会话恢复中 */
  loading: boolean;
  /** MMKV 冒烟测试结果(失败时登录会话无法持久化) */
  storageReady: boolean;
  /** 发送验证码并缓存验证句柄(登录时复用,勿重复发送) */
  requestCode(phone: string): Promise<void>;
  login(phone: string, code: string): Promise<void>;
  logout(): Promise<void>;
  /** 注销第一步:向本人手机号发送注销验证码 */
  requestDeletionCode(): Promise<void>;
  /** 注销第二步:输入验证码完成删除 */
  deleteAccount(code: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageReady, setStorageReady] = useState(true);
  const handleRef = useRef<VerificationHandle | null>(null);

  useEffect(() => {
    (async () => {
      setStorageReady(runStorageSmokeTest());
      try {
        const restored = await restoreSession();
        setUser(restored);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    storageReady,
    requestCode: async (phone) => {
      const handle = await sendSmsCode(phone);
      handleRef.current = handle;
    },
    login: async (phone, code) => {
      if (!handleRef.current) throw new Error('请先获取验证码');
      const u = await loginWithCode(phone, handleRef.current, code);
      handleRef.current = null;
      setUser(u);
    },
    logout: async () => {
      await logoutRemote();
      setUser(null);
    },
    requestDeletionCode: () => requestDeletionCode(),
    deleteAccount: async (code) => {
      await deleteAccountRemote(code);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}

export { setCurrentUid };
