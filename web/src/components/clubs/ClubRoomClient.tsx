"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  BookOpen,
  Send,
  Loader2,
  Check,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

export function ClubRoomClient({
  club,
  initialJoined,
  isLoggedIn,
}: {
  club: any
  initialJoined: boolean
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [joined, setJoined] = useState(initialJoined)
  const [toggling, setToggling] = useState(false)
  const [chapterLabel, setChapterLabel] = useState("")
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)

  const handleToggleJoin = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/clubs/${club.id}`)
      return
    }
    setToggling(true)
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setJoined(data.joined)
      toast.success(
        data.joined ? "Joined Sabha Circle!" : "Left Sabha Circle."
      )
      router.refresh()
    } catch {
      toast.error("Could not update membership")
    } finally {
      setToggling(false)
    }
  }

  const handlePostReflection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/clubs/${club.id}`)
      return
    }
    if (!content.trim()) return

    setPosting(true)
    try {
      const res = await fetch(`/api/clubs/${club.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterLabel, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setContent("")
      setChapterLabel("")
      setJoined(true)
      toast.success("Reflection shared with the circle!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not post reflection")
    } finally {
      setPosting(false)
    }
  }

  const readHref = club.ebookKey
    ? `/ebooks/${encodeURIComponent(club.ebookKey)}`
    : `/ebooks?q=${encodeURIComponent(club.bookTitle)}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Book & Members */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#C84200]">
              Featured Sabha Text
            </span>
            <h2 className="text-2xl font-black text-[#1D1D1F] mt-1">
              {club.bookTitle}
            </h2>
            <p className="text-sm font-medium text-[#86868b]">
              by {club.bookAuthor}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href={readHref}
              className="w-full py-3 px-5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />{" "}
              {club.ebookKey
                ? "Read Now in Free E-Library"
                : "Find in Free E-Library"}
            </Link>

            <Link
              href={`/catalog?q=${encodeURIComponent(club.bookTitle)}`}
              className="w-full py-3 px-5 rounded-full bg-[#FAF6F0] hover:bg-black/5 text-[#1D1D1F] font-bold text-xs flex items-center justify-center gap-2 border border-black/10 transition-colors"
            >
              Find Physical Copy / Swap
            </Link>

            <button
              type="button"
              disabled={toggling}
              onClick={handleToggleJoin}
              className={`w-full py-3 px-5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                joined
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-[#0066cc] hover:bg-[#0071e3] text-white"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : joined ? (
                <>
                  <Check className="w-4 h-4" /> Member of this Sabha
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Join Reading Sabha
                </>
              )}
            </button>
          </div>
        </div>

        {/* Members Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0066cc]" /> Circle Readers (
            {club.members.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {club.members.map((m: any) => (
              <Link
                key={m.id}
                href={`/profile/${m.user.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF6F0] hover:bg-black/5 border border-black/5 text-xs font-bold text-[#1D1D1F]"
              >
                <span className="w-5 h-5 rounded-full bg-[#1D1D1F] text-white text-[10px] font-black flex items-center justify-center overflow-hidden">
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.user.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (m.user.name || "R").charAt(0).toUpperCase()
                  )}
                </span>
                <span>{m.user.name || "Reader"}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Chapter Reflections Feed */}
      <div className="lg:col-span-8 space-y-6">
        <form
          onSubmit={handlePostReflection}
          className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-base text-[#1D1D1F] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C84200]" /> Share a
              Chapter Reflection or Quote
            </h3>
            <input
              type="text"
              value={chapterLabel}
              onChange={(e) => setChapterLabel(e.target.value)}
              placeholder="Chapter / Page (e.g. Ch. 4)"
              className="h-9 w-48 rounded-full bg-[#FAF6F0] px-3.5 text-xs font-bold text-[#1D1D1F] outline-none"
            />
          </div>

          <textarea
            rows={3}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What stood out to you in "${club.bookTitle}"? Share a thought, question, or favorite passage...`}
            className="w-full rounded-2xl bg-[#FAF6F0] p-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/20 resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={posting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-[#C84200] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              {posting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Post to Sabha
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {club.posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-black/5 text-[#86868b]">
              <p className="font-bold text-base text-[#1D1D1F]">
                No chapter reflections yet
              </p>
              <p className="text-xs mt-1">
                Start the conversation above with your first note or favorite
                quote!
              </p>
            </div>
          ) : (
            club.posts.map((post: any) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/profile/${post.author.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white text-xs font-black flex items-center justify-center overflow-hidden">
                      {post.author.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.author.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (post.author.name || "R").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1D1D1F] hover:underline">
                        {post.author.name || "Reader"}
                      </p>
                      <p className="text-[11px] text-[#86868b]">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>

                  {post.chapterLabel && (
                    <span className="px-3 py-1 rounded-full bg-[#FAF6F0] text-[#C84200] text-xs font-black">
                      {post.chapterLabel}
                    </span>
                  )}
                </div>

                <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

