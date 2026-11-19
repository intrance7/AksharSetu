import PusherServer from "pusher"

const appId = process.env.PUSHER_APP_ID?.trim() || ""
const key = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() || ""
const secret = process.env.PUSHER_SECRET?.trim() || ""
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim() || ""

export const isPusherServerConfigured = Boolean(
  appId &&
    key &&
    secret &&
    cluster &&
    appId !== "placeholder" &&
    key !== "placeholder" &&
    secret !== "placeholder"
)

// Server-only Pusher instance (never imported by client components)
export const pusherServer = new PusherServer({
  appId: appId || "unconfigured",
  key: key || "unconfigured",
  secret: secret || "unconfigured",
  cluster: cluster || "ap2",
  useTLS: true,
})

export async function triggerPusherEvent(
  channel: string,
  event: string,
  payload: unknown
) {
  if (!isPusherServerConfigured) return
  try {
    await pusherServer.trigger(channel, event, payload)
  } catch {
    // Non-fatal fallback when Pusher is offline or unconfigured
  }
}
