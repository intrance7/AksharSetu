"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, User, BookOpen, MessageCircle, Users } from "lucide-react"

interface LiveReader {
  userId: string
  name: string
  image: string | null
  isLive: boolean
  statusText: string
  totalMinutes: number
  ebookId: string | null
}

export function LiveReadersStrip() {
  const [readers, setReaders] = useState<LiveReader[]>([])
  const [liveCount, setLiveCount] = useState(0)
  const [mutualCount, setMutualCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = () => {
      fetch("/api/shanti/live")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setReaders(Array.isArray(data.readers) ? data.readers : [])
            setLiveCount(Number(data.liveCount) || 0)
            setMutualCount(Number(data.mutualCount) || 0)
          }
          setLoaded(true)
        })
        .catch(() => setLoaded(true))
    }
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [])

  if (!loaded) return null

  return (
    <section className="relative bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.18),transparent_58%)] text-[#F5F5F7] rounded-3xl p-6 sm:p-7 border border-white/10 shadow-sm overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {liveCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  liveCount > 0 ? "bg-emerald-500" : "bg-white/30"
                }`}
              />
            </span>
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#FF8A4C]">
              Shanti Together · Reading Sanctuary
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
              Mutual Followers Only
            </span>
            {liveCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                {liveCount} Live Now
              </span>
            )}
          </div>
          <Link
            href="/leaderboard?tab=directory"
            className="text-sm font-bold text-white/75 hover:text-white transition"
          >
            Find & Follow Readers →
          </Link>
        </div>

        {readers.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#FF8A4C]" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-white">
                  {mutualCount === 0
                    ? "No mutual reading companions yet"
                    : "None of your mutual followers are in Shanti Mode right now"}
                </p>
                <p className="text-xs sm:text-sm text-white/65 mt-0.5">
                  For privacy, Shanti focus status is only shared between readers
                  who follow each other.
                </p>
              </div>
            </div>
            <Link
              href="/leaderboard?tab=directory"
              className="inline-flex items-center justify-center rounded-full bg-white/12 hover:bg-white/20 px-5 py-2.5 text-sm font-bold text-white shrink-0 transition"
            >
              Browse Reader Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {readers.slice(0, 4).map((r) => (
              <div
                key={r.userId}
                className="rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 p-4 flex flex-col justify-between gap-3.5 transition"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/profile/${r.userId}`}
                    className="relative w-11 h-11 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0"
                  >
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image}
                        alt={r.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white/60" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/profile/${r.userId}`}
                        className="text-sm font-bold text-white hover:text-[#FF8A4C] truncate"
                      >
                        {r.name}
                      </Link>
                      {r.isLive && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                          title="Currently in Shanti Focus"
                        />
                      )}
                    </div>
                    <p className="text-xs sm:text-[13px] text-white/65 line-clamp-1">
                      {r.statusText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs sm:text-[13px]">
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> {r.totalMinutes}m focus
                  </span>
                  <div className="flex items-center gap-2.5">
                    {r.ebookId && (
                      <Link
                        href={`/ebooks/${encodeURIComponent(
                          r.ebookId
                        )}?view=book`}
                        className="inline-flex items-center gap-1 text-[#FF8A4C] hover:underline font-bold"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Read Too
                      </Link>
                    )}
                    <Link
                      href={`/messages/${r.userId}`}
                      className="text-white/65 hover:text-white"
                      title={`Message ${r.name}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
