// Curated emoji set. Used by the composer picker and as the server-side
// allowlist for reactions (so reactions can't carry arbitrary strings).

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "📚"] as const

export const EMOJI_CATEGORIES: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "smileys",
    label: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😊", "🙂", "😉", "😍",
      "🥰", "😘", "😎", "🤓", "🤔", "🤨", "😐", "😅",
      "😂", "🤣", "😇", "🥲", "😮", "😯", "😢", "😭",
      "😤", "😴", "🤗", "🙃", "😬", "🫡", "🥳", "😌",
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤝", "🙏", "👏",
      "🙌", "👋", "🤙", "💪", "👀", "🫶", "☝️", "✋",
    ],
  },
  {
    id: "hearts",
    label: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "💯", "✨", "🔥", "⭐"],
  },
  {
    id: "study",
    label: "Books & study",
    emojis: [
      "📚", "📖", "📕", "📗", "📘", "📙", "📓", "📒",
      "🔖", "✏️", "🖊️", "📝", "🎓", "🏫", "🧠", "💡",
      "📐", "🧮", "🔬", "🧪", "🗂️", "📎", "🪔", "☕",
    ],
  },
  {
    id: "handoff",
    label: "Handoff",
    emojis: [
      "📦", "🚚", "📍", "🗺️", "🚇", "🚌", "🛺", "🕒",
      "📅", "💸", "💰", "🧾", "✅", "❌", "⏳", "🔁",
    ],
  },
]

export const ALL_EMOJIS = new Set(EMOJI_CATEGORIES.flatMap((c) => c.emojis))

export function isAllowedEmoji(value: unknown): value is string {
  return typeof value === "string" && ALL_EMOJIS.has(value)
}
