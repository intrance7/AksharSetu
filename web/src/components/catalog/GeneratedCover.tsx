"use client"

interface GeneratedCoverProps {
  title: string
  author: string
  category?: string | null
}

const CATS: Record<string, { bg: string; fg: string; svg: React.ReactNode }> = {
  engineering: {
    bg: "#3B4CCA",
    fg: "#FFF8E6",
    svg: (
      <>
        <rect width="100" height="140" fill="url(#p-grid)" />
        <path
          d="M12 22H38V44H66V16H88"
          fill="none"
          stroke="#FFC94A"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 62H30V38"
          fill="none"
          stroke="#fff"
          strokeOpacity=".6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="22" r="3.6" fill="#FFC94A" />
        <circle cx="88" cy="16" r="3.6" fill="#FFF8E6" />
        <circle cx="30" cy="38" r="2.8" fill="#fff" />
        <rect
          x="60"
          y="52"
          width="22"
          height="10"
          rx="2.5"
          fill="none"
          stroke="#FFC94A"
          strokeWidth="1.6"
        />
      </>
    ),
  },
  medical: {
    bg: "#0B8577",
    fg: "#FFF8E6",
    svg: (
      <>
        <rect x="41" y="6" width="18" height="44" rx="6" fill="#FFF3D6" />
        <rect x="28" y="19" width="44" height="18" rx="6" fill="#FFF3D6" />
        <path
          d="M-2 64H30L36 55L44 74L51 60L56 64H102"
          fill="none"
          stroke="#9BF0DB"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  fiction: {
    bg: "#C93A64",
    fg: "#FFF8E6",
    svg: (
      <>
        <circle cx="56" cy="30" r="19" fill="#FFE9A8" />
        <circle cx="67" cy="23" r="17" fill="#C93A64" />
        <use
          href="#i-star"
          x="12"
          y="12"
          width="13"
          height="13"
          fill="#FFE9A8"
        />
        <use
          href="#i-star"
          x="24"
          y="46"
          width="8"
          height="8"
          fill="#fff"
          fillOpacity=".85"
        />
        <use
          href="#i-star"
          x="76"
          y="50"
          width="11"
          height="11"
          fill="#FFE9A8"
        />
        <circle cx="14" cy="62" r="1.6" fill="#fff" fillOpacity=".7" />
        <circle cx="52" cy="64" r="1.3" fill="#fff" fillOpacity=".7" />
      </>
    ),
  },
  "non-fiction": {
    bg: "#F4B22B",
    fg: "#1D1B26",
    svg: (
      <>
        <g
          fill="none"
          stroke="#1D1B26"
          strokeOpacity=".2"
          strokeWidth="1.2"
        >
          <path d="M8 62A42 42 0 0 1 92 62" />
          <path d="M17 62A33 33 0 0 1 83 62" />
          <path d="M26 62A24 24 0 0 1 74 62" />
        </g>
        <path d="M33 62A17 17 0 0 1 67 62Z" fill="#C4420C" />
        <path
          d="M4 62H96"
          stroke="#1D1B26"
          strokeOpacity=".7"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  school: {
    bg: "#C84200",
    fg: "#FFF8E6",
    svg: (
      <>
        <rect width="100" height="140" fill="url(#p-grid)" />
        <circle cx="50" cy="34" r="18" fill="none" stroke="#FFE9A8" strokeWidth="2.2" />
        <path d="M32 34H68M50 16V52" stroke="#FFE9A8" strokeOpacity=".6" strokeWidth="1.6" />
      </>
    ),
  },
  default: {
    bg: "#1D1D1F",
    fg: "#F2EBE1",
    svg: (
      <>
        <rect width="100" height="140" fill="url(#p-grid)" />
      </>
    ),
  },
}

export function GeneratedCover({
  title,
  author,
  category,
}: GeneratedCoverProps) {
  const safeTitle = (title || "Untitled Book").trim() || "Untitled Book"
  const safeAuthor = (author || "AksharSetu Reader").trim() || "AksharSetu Reader"
  const catKey = category?.toLowerCase() || "default"
  const deco = CATS[catKey] || CATS.default

  const words = safeTitle.split(/\s+/).filter(Boolean)
  const longestWord = Math.max(1, ...words.map((w) => w.length))
  let titleCqw = Math.min(18, 125 / (longestWord * 1.15))
  if (safeTitle.length > 16) titleCqw = Math.min(titleCqw, 14)
  if (safeTitle.length > 28) titleCqw = Math.min(titleCqw, 11.5)
  titleCqw = Math.max(8.5, titleCqw)

  return (
    <div
      className="relative w-full h-full rounded-md shadow-inner overflow-hidden select-none"
      style={{
        backgroundColor: deco.bg,
        color: deco.fg,
        containerType: "inline-size",
      }}
    >
      <svg
        width="0"
        height="0"
        className="absolute"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern
            id="p-grid"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M8 0H0V8"
              fill="none"
              stroke="#fff"
              strokeOpacity=".14"
              strokeWidth=".5"
            />
          </pattern>
          <symbol id="i-star" viewBox="-6 -6 12 12">
            <path d="M0-6L1.6-1.6 6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6Z" />
          </symbol>
        </defs>
      </svg>

      {/* Spine lighting effects */}
      <div
        className="absolute inset-y-0 left-0 w-[11%] z-20"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,.3), rgba(0,0,0,.06) 68%, rgba(255,255,255,.2) 88%, rgba(0,0,0,.1))",
        }}
      />
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(115deg, rgba(255,255,255,.22), transparent 38%)",
        }}
      />

      {/* Background SVG Decoration */}
      <svg
        className="absolute inset-0 w-full h-full opacity-90 z-10"
        viewBox="0 0 100 140"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {deco.svg}
      </svg>

      {/* Text Content (scales proportionally to cover width via cqw) */}
      <div className="absolute left-[15%] right-[7%] bottom-[8%] z-10 flex flex-col justify-end">
        <p
          className="font-black leading-[1.06] tracking-tight mb-1.5 break-words line-clamp-4"
          style={{ fontSize: `clamp(0.55rem, ${titleCqw.toFixed(1)}cqw, 1.95rem)` }}
        >
          {safeTitle}
        </p>
        <p
          className="font-bold opacity-90 leading-tight truncate"
          style={{ fontSize: "clamp(0.45rem, 6.8cqw, 0.8rem)" }}
        >
          {safeAuthor}
        </p>
      </div>
    </div>
  )
}
