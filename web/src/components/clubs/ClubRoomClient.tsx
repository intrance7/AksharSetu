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
  KeyRound,
  Copy,
  RefreshCw,
  Lock,
  Globe,
  Crown,
  Share2,
} from "lucide-react"
import { toast } from "sonner"

export function ClubRoomClient({
  club,
  initialJoined,
  isLeader,
  isLoggedIn,
}: {
  club: any
  initialJoined: boolean
  isLeader: boolean
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [joined, setJoined] = useState(initialJoined)
  const [toggling, setToggling] = useState(false)
  const [chapterLabel, setChapterLabel] = useState("")
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)

  // Private team unlock state & Leader controls
  const [privateCodeInput, setPrivateCodeInput] = useState("")
  const [inviteCode, setInviteCode] = useState<string | null>(
    club.inviteCode || null
  )
  const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(club.isPrivate))
  const [updatingTeam, setUpdatingTeam] = useState(false)

  const handleToggleJoin = async (providedCode?: string) => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/clubs/${club.id}`)
      return
    }
    setToggling(true)
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: providedCode || privateCodeInput,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update membership")
      setJoined(data.joined)
      toast.success(
        data.joined ? "Joined Sabha Team!" : "Left Sabha Team."
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not update team membership")
    } finally {
      setToggling(false)
    }
  }

  const handleCopyCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    toast.success(`Copied Team Code: ${inviteCode}`)
  }

  const handleCopyInviteLink = () => {
    if (!inviteCode || typeof window === "undefined") return
    const url = `${window.location.origin}/clubs?code=${encodeURIComponent(
      inviteCode
    )}`
    navigator.clipboard.writeText(url)
    toast.success("Copied direct Sabha Team invite link!")
  }

  const handleLeaderUpdate = async (payload: {
    regenerateCode?: boolean
    isPrivate?: boolean
  }) => {
    setUpdatingTeam(true)
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update team")
      if (data.inviteCode) setInviteCode(data.inviteCode)
      if (typeof data.isPrivate === "boolean") setIsPrivate(data.isPrivate)
      toast.success(
        payload.regenerateCode
          ? `New Team Code generated: ${data.inviteCode}`
          : `Team visibility set to ${data.isPrivate ? "Private" : "Public"}`
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not update team settings")
    } finally {
      setUpdatingTeam(false)
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
      toast.success("Reflection shared with your Sabha Team!")
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

  // Gate view if team is private and user is not a member yet
  if (isPrivate && !joined) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 shadow-sm border border-[#1D1D1F]/10 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#C84200]">
            Invite-Only Sabha Team
          </span>
          <h2 className="text-2xl font-black text-[#1D1D1F] mt-1">
            Enter Team Code to Join &ldquo;{club.name}&rdquo;
          </h2>
          <p className="text-xs sm:text-sm text-[#86868b] mt-1.5">
            This reading squad is private. Enter the{" "}
            <span className="font-mono font-bold text-[#1D1D1F]">
              SABHA-XXXXXX
            </span>{" "}
            invite code shared by the team leader to unlock discussions and
            co-reading.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleToggleJoin(privateCodeInput)
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            required
            value={privateCodeInput}
            onChange={(e) => setPrivateCodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. SABHA-7K2M9P"
            className="flex-1 h-12 rounded-full bg-[#FAF6F0] border border-black/10 px-5 text-sm font-mono font-bold uppercase text-center sm:text-left outline-none focus:border-[#C84200]"
          />
          <button
            type="submit"
            disabled={toggling}
            className="h-12 px-7 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            {toggling ? "Verifying..." : "Unlock & Join Team"}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Invite Code Card, Book & Team Roster */}
      <div className="lg:col-span-4 space-y-6">
        {/* Team Invite Code Card */}
        {inviteCode && (
          <div className="bg-[#1D1D1F] text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#C84200]">
                <KeyRound className="w-3.5 h-3.5" /> Team Invite Code
              </span>
              <span className="text-[11px] font-semibold text-white/60">
                Share with friends
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <span className="font-mono text-lg font-black tracking-widest text-white">
                {inviteCode}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy Invite Code"
                  className="p-2 rounded-xl bg-white/10 hover:bg-[#C84200] text-white transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  title="Copy Direct Invite Link"
                  className="p-2 rounded-xl bg-white/10 hover:bg-[#C84200] text-white transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLeader && (
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={updatingTeam}
                  onClick={() => handleLeaderUpdate({ regenerateCode: true })}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/75 hover:text-white cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Rotate Code
                </button>
                <button
                  type="button"
                  disabled={updatingTeam}
                  onClick={() =>
                    handleLeaderUpdate({ isPrivate: !isPrivate })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white cursor-pointer"
                >
                  {isPrivate ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" /> Private Mode
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 text-emerald-400" /> Public Mode
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Featured Team Book Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-black/5 space-y-5">
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
              onClick={() => handleToggleJoin()}
              className={`w-full py-3 px-5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                joined
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-[#1D1D1F] hover:bg-[#C84200] text-white"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : joined ? (
                <>
                  <Check className="w-4 h-4" /> Member of this Sabha Team
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Join Sabha Team
                </>
              )}
            </button>
          </div>
        </div>

        {/* Team Roster Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-black/5">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#1D1D1F] mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C84200]" /> Team Roster
            </span>
            <span className="text-[#86868b]">
              {club.members.length} / {club.maxMembers || 25}
            </span>
          </h3>
          <div className="space-y-2">
            {club.members.map((m: any) => {
              const isMemberLeader =
                m.role === "LEADER" || m.user.id === club.creatorId
              return (
                <Link
                  key={m.id}
                  href={`/profile/${m.user.id}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF6F0] hover:bg-[#F2EBE1] border border-black/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white text-xs font-black flex items-center justify-center overflow-hidden shrink-0">
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
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1D1D1F] truncate">
                        {m.user.name || "Reader"}
                      </p>
                      {joined && m.user.isShantiModeActive && (
                        <p className="text-[10px] font-semibold text-emerald-700 truncate">
                          ● In Shanti Focus
                        </p>
                      )}
                    </div>
                  </div>
                  {isMemberLeader && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase shrink-0">
                      <Crown className="w-2.5 h-2.5" /> Leader
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Chapter Reflections Feed */}
      <div className="lg:col-span-8 space-y-6">
        <form
          onSubmit={handlePostReflection}
          className="bg-white rounded-3xl p-6 shadow-xs border border-black/5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-black text-base text-[#1D1D1F] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C84200]" /> Share a Team
              Reflection or Chapter Note
            </h3>
            <input
              type="text"
              value={chapterLabel}
              onChange={(e) => setChapterLabel(e.target.value)}
              placeholder="Chapter / Page (e.g. Ch. 4)"
              className="h-9 sm:w-48 rounded-full bg-[#FAF6F0] px-3.5 text-xs font-bold text-[#1D1D1F] outline-none"
            />
          </div>

          <textarea
            rows={3}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What stood out to you in "${club.bookTitle}"? Share a thought, problem solution, or favorite passage with your team...`}
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
              Post to Team
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {club.posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-black/5 text-[#86868b]">
              <p className="font-bold text-base text-[#1D1D1F]">
                No team reflections yet
              </p>
              <p className="text-xs mt-1">
                Start the conversation above with your first chapter note or
                invite teammates using code{" "}
                <span className="font-mono font-bold text-[#1D1D1F]">
                  {inviteCode}
                </span>
                !
              </p>
            </div>
          ) : (
            club.posts.map((post: any) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-6 shadow-xs border border-black/5 space-y-3"
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
