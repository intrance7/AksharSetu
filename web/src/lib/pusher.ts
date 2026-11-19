import PusherClient from "pusher-js"

// Client-side Pusher singleton.
// Private channels (private-*) are authorized by /api/pusher/auth, which checks
// conversation membership server-side before signing the subscription.
let pusherClientInstance: PusherClient | null = null

export const isPusherClientConfigured = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim()
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim()
  return Boolean(key && cluster && key !== "placeholder")
}

function createNoopPusherClient(): PusherClient {
  const noopChannel = {
    bind: () => noopChannel,
    unbind: () => noopChannel,
    unbind_all: () => noopChannel,
  }
  return {
    subscribe: () => noopChannel,
    unsubscribe: () => undefined,
    channel: () => undefined,
    disconnect: () => undefined,
    connection: {
      state: "disconnected",
      bind: () => undefined,
      unbind: () => undefined,
    },
  } as unknown as PusherClient
}

export const getPusherClient = (): PusherClient => {
  if (!isPusherClientConfigured()) {
    return createNoopPusherClient()
  }
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
