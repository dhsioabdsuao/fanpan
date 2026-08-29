// 墨夜模式星点背景(二十八宿意象,浅色模式隐藏)
// 星点位置为手工排布的确定性伪随机,不做运行时随机
const STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 6, y: 12, r: 1.2, o: 0.7 }, { x: 14, y: 8, r: 0.8, o: 0.45 },
  { x: 23, y: 18, r: 1.0, o: 0.55 }, { x: 31, y: 6, r: 0.7, o: 0.4 },
  { x: 38, y: 24, r: 1.3, o: 0.65 }, { x: 47, y: 10, r: 0.9, o: 0.5 },
  { x: 55, y: 28, r: 1.1, o: 0.6 }, { x: 63, y: 7, r: 0.7, o: 0.35 },
  { x: 71, y: 20, r: 1.0, o: 0.5 }, { x: 79, y: 12, r: 0.8, o: 0.45 },
  { x: 87, y: 26, r: 1.2, o: 0.6 }, { x: 94, y: 9, r: 0.9, o: 0.5 },
  { x: 9, y: 38, r: 0.8, o: 0.4 }, { x: 18, y: 48, r: 1.1, o: 0.55 },
  { x: 27, y: 34, r: 0.7, o: 0.35 }, { x: 36, y: 56, r: 1.0, o: 0.5 },
  { x: 45, y: 41, r: 0.9, o: 0.45 }, { x: 54, y: 62, r: 1.2, o: 0.6 },
  { x: 62, y: 36, r: 0.7, o: 0.4 }, { x: 70, y: 55, r: 1.0, o: 0.5 },
  { x: 78, y: 44, r: 0.8, o: 0.4 }, { x: 86, y: 66, r: 1.1, o: 0.55 },
  { x: 93, y: 47, r: 0.9, o: 0.45 }, { x: 5, y: 68, r: 1.0, o: 0.5 },
  { x: 15, y: 78, r: 0.8, o: 0.4 }, { x: 25, y: 61, r: 1.1, o: 0.55 },
  { x: 33, y: 82, r: 0.7, o: 0.35 }, { x: 43, y: 68, r: 1.0, o: 0.5 },
  { x: 52, y: 86, r: 1.2, o: 0.6 }, { x: 61, y: 72, r: 0.8, o: 0.4 },
  { x: 69, y: 90, r: 1.0, o: 0.5 }, { x: 77, y: 75, r: 0.9, o: 0.45 },
  { x: 85, y: 92, r: 1.1, o: 0.55 }, { x: 92, y: 79, r: 0.8, o: 0.4 },
  { x: 11, y: 92, r: 0.9, o: 0.45 }, { x: 21, y: 88, r: 0.7, o: 0.35 },
]

export function StarfieldBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden dark:block"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#d4a94e"
            opacity={s.o}
          />
        ))}
      </svg>
      {/* 底部微光,营造墨夜层次 */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#d4a94e]/[0.06] to-transparent" />
    </div>
  )
}
