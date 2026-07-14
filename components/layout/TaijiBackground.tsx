export function TaijiBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          {/* S-curve dividing the entire viewport */}
          <clipPath id="yin-bg">
            <path d="M 0,0 L 500,0 C 300,250 700,750 500,1000 L 0,1000 Z" />
          </clipPath>

          {/* S-curve for the taiji yang-half */}
          <clipPath id="taiji-yang">
            <path d="M 500,60 A 440,440 0 0,1 500,940 A 220,220 0 0,0 500,500 A 220,220 0 0,1 500,60 Z" />
          </clipPath>
        </defs>

        {/* ── Background split ── */}
        {/* Yang (light) side — fills entire rect first */}
        <rect x="0" y="0" width="1000" height="1000" fill="#f5f0e8" />
        {/* Yin (dark) side — clipped to left of S-curve */}
        <rect x="0" y="0" width="1000" height="1000" fill="#1f1d1a" clipPath="url(#yin-bg)" />

        {/* Subtle S-curve divider line */}
        <path
          d="M 500,-10 C 300,250 700,750 500,1010"
          fill="none"
          stroke="#a09888"
          strokeWidth="1"
          opacity="0.25"
        />

        {/* ── Rotating taiji + bagua ── */}
        <g
          className="taiji-rotate"
          style={{ transformOrigin: '500px 500px' }}
        >
          {/* Taiji circle background — yin */}
          <circle cx="500" cy="500" r="440" fill="#1f1d1a" />
          {/* Taiji circle — yang half */}
          <circle cx="500" cy="500" r="440" fill="#f5f0e8" clipPath="url(#taiji-yang)" />

          {/* Fish eyes — 阴中有阳（亮点在左下阴鱼头），阳中有阴（暗点在右上阳鱼头） */}
          <circle cx="420" cy="780" r="40" fill="#f5f0e8" />
          <circle cx="580" cy="220" r="40" fill="#1f1d1a" />

          {/* Inner ring */}
          <circle
            cx="500" cy="500" r="440"
            fill="none" stroke="#a09888" strokeWidth="1.5" opacity="0.35"
          />
          {/* Outer ring */}
          <circle
            cx="500" cy="500" r="465"
            fill="none" stroke="#a09888" strokeWidth="0.5" opacity="0.2"
          />

          {/* ── 八卦 (Bagua) ── */}
          <g fontSize="34" fill="#a09888" opacity="0.45" textAnchor="middle" dominantBaseline="central">
            {/* 乾 — top */}
            <text x="500" y="40">☰</text>
            {/* 兑 — top-right */}
            <text x="840" y="172">☱</text>
            {/* 离 — right */}
            <text x="960" y="500">☲</text>
            {/* 震 — bottom-right */}
            <text x="840" y="828">☳</text>
            {/* 坤 — bottom */}
            <text x="500" y="960">☷</text>
            {/* 艮 — bottom-left */}
            <text x="160" y="828">☶</text>
            {/* 坎 — left */}
            <text x="40" y="500">☵</text>
            {/* 巽 — top-left */}
            <text x="160" y="172">☴</text>
          </g>
        </g>
      </svg>
    </div>
  )
}
