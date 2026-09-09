// ─────────────────────────────────────────────────────────────
// 腾讯云开发 CloudBase 配置(控制台建好环境后填入)
//
// 获取方式(CloudBase 控制台 https://tcb.cloud.tencent.com):
//   env       — 环境 ID,形如「your-env-1a2b3c」(控制台首页环境卡片上)
//   region    — 环境地域(创建环境时选择,如 ap-shanghai / ap-guangzhou)
//   accessKey — 「身份认证 → 登录管理」页生成的 Publishable Key(公开密钥,
//               仅用于前端访问标识,不是腾讯云 API 密钥;真密钥勿放这里)
//
// 填好前,登录/发帖会报网络错误,不影响排盘。
// ─────────────────────────────────────────────────────────────

export const CLOUDBASE_CONFIG = {
  env: 'bazi-d8gfpxs5ob010f6dc',
  region: 'ap-shanghai',
  // Publishable Key(身份认证 → 登录管理 生成;公开用途,等同 Supabase anon key)
  accessKey:
    'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2JhemktZDhnZnB4czVvYjAxMGY2ZGMuYXAtc2hhbmdoYWkudGNiLWFwaS50ZW5jZW50Y2xvdWRhcGkuY29tIiwic3ViIjoiYW5vbiIsImF1ZCI6ImJhemktZDhnZnB4czVvYjAxMGY2ZGMiLCJleHAiOjQwOTIwOTc3OTksImlhdCI6MTc4ODQxNDU5OSwibm9uY2UiOiI3dTBrUV9qWFJ4U2xmYmgxb3BuR1RnIiwiYXRfaGFzaCI6Ijd1MGtRX2pYUnhTbGZiaDFvcG5HVGciLCJuYW1lIjoiQW5vbnltb3VzIiwic2NvcGUiOiJhbm9ueW1vdXMiLCJwcm9qZWN0X2lkIjoiYmF6aS1kOGdmcHhzNW9iMDEwZjZkYyIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.nkPZd_3HK29tuuxxQO26PX4O9RmnGQo0cEe5oLxp9NBrcWbVQ1IxC7G3jzK3ACdhHSSLzbFvO9P5xStTSkh4bayAk1W9LBIhSIyczZ88af5-LpPULgsdhlVGULBbPlL2q0BGDBa9A1xBZPQ9VdPTaEc4t-1_eenInP8ZUJdVDZ0Y4aKad1oiAVQfj6PPbYUVK35WzK268B-_HhEMlNANL380EIaHx5ZoHmZqOceyoA-epc-GFK_QiLg5qE_fS_9ysyFtONjbFOGSyCT5Sl5CyhTDcZxlsCONJTejX4BO49qT3i12iIzi4HuuLZyffHLs3C-WjwYtG27rZkIJkUdSbw',
};
