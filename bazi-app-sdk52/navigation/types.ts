import type { MobileBaziInputParams } from '../adapters/bazi-input-adapter';
import type { PostDraft } from '@/community';

/** 根栈:任何 Tab 都能推入的全屏页面(推入时自然盖住 tab bar) */
export type RootStackParamList = {
  MainTabs: undefined;
  PostDetail: { postId: string };
  Publish: { draft: PostDraft };
  Login: undefined;
  UserAgreement: undefined;
};

/** 底部三 Tab */
export type MainTabParamList = {
  HomeTab: undefined;
  SquareTab: undefined;
  ProfileTab: undefined;
};

/** 首页 Tab 内栈(现有 5 屏原样迁入) */
export type HomeStackParamList = {
  Home: undefined;
  Result: MobileBaziInputParams;
  About: undefined;
  Privacy: undefined;
  History: undefined;
};

/** 广场 Tab 内栈 */
export type SquareStackParamList = {
  Feed: undefined;
};

/** 我的 Tab 内栈 */
export type ProfileStackParamList = {
  Profile: undefined;
};
