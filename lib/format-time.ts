/** 把分钟数格式化为 "−2h 9m 40s" 这种字符串 */
export function formatMinutesOffset(totalMinutes: number): string {
  const sign = totalMinutes >= 0 ? '+' : '−'
  const abs = Math.abs(totalMinutes)
  const h = Math.floor(abs / 60)
  const m = Math.floor(abs % 60)
  const s = Math.round((abs % 1) * 60)
  if (h > 0) return `${sign}${h}h ${m}m ${s}s`
  return `${sign}${m}m ${s}s`
}

/** Date → "1990年6月15日 00:30:00" 格式（含秒） */
export function formatChineseSolarDatetime(date: Date): string {
  const y = date.getFullYear()
  const mo = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}年${mo}月${d}日 ${hh}:${mm}:${ss}`
}

/** Date → "1990-06-15 00:30" 格式（不含秒，用于北京时间副行） */
export function formatDateHM(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d} ${hh}:${mm}`
}
