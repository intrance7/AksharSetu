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
    <section className="bg-black text-[#f5f5f7] rounded-2xl p-5 sm:p-6 border border-white/10 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
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
          <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
            Shanti Together · Reading Sanctuary
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/75 text-[10px] font-semibold">
            Mutual Followers Only
          </span>
          {liveCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
              {liveCount} Live Now
            </span>
          )}
        </div>
        <Link
          href="/leaderboard?tab=directory"
          className="text-xs font-semibold text-[#86868b] hover:text-white transition"
        >
          Find & Follow Readers →
        </Link>
      </div>

      {readers.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {mutualCount === 0
                  ? "No mutual reading companions yet"
                  : "None of your mutual followers are in Shanti Mode right now"}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                For privacy, Shanti focus status is only shared between readers
                who follow each other.
              </p>
            </div>
          </div>
          <Link
            href="/leaderboard?tab=directory"
            className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold text-white shrink-0 transition"
          >
            Browse Reader Directory
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {readers.slice(0, 4).map((r) => (
            <div
              key={r.userId}
              className="rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 p-3.5 flex flex-col justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${r.userId}`}
                  className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0"
                >
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-[#86868b]" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profile/${r.userId}`}
                      className="text-xs font-bold text-white hover:text-blue-300 truncate"
                    >
                      {r.name}
                    </Link>
                    {r.isLive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                        title="Currently in Shanti Focus"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-[#86868b] line-clamp-1">
                    {r.statusText}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Sparkles className="w-3 h-3" /> {r.totalMinutes}m focus
                </span>
                <div className="flex items-center gap-2">
                  {r.ebookId && (
                    <Link
                      href={`/ebooks/${encodeURIComponent(
                        r.ebookId
                      )}?view=book`}
                      className="inline-flex items-center gap-1 text-blue-300 hover:underline font-semibold"
                    >
                      <BookOpen className="w-3 h-3" /> Read Too
                    </Link>
                  )}
                  <Link
                    href={`/messages/${r.userId}`}
                    className="text-[#86868b] hover:text-white"
                    title={`Message ${r.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
