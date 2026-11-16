import PusherServer from "pusher"
import PusherClient from "pusher-js"

export const isPusherServerConfigured = Boolean(
  process.env.PUSHER_APP_ID &&
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
)

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "unconfigured",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "unconfigured",
  secret: process.env.PUSHER_SECRET || "unconfigured",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  useTLS: true,
})

// Client-side Pusher instance singleton.
// Private channels (private-*) are authorized by /api/pusher/auth, which checks
// conversation membership server-side before signing the subscription.
let pusherClientInstance: PusherClient | null = null

export const isPusherClientConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)

export const getPusherClient = () => {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    })
  }
  return pusherClientInstance
}
