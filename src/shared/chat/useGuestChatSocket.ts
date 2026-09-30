import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from '@/shared/auth/session'
import { getWsUrl } from '@/shared/api/client'
import { guestChatKeys } from './chat.api'
import type { ChatMessage } from './types'

let sharedSocket: Socket | null = null

export function getGuestChatSocket(): Socket | null {
  return sharedSocket
}

/**
 * Connects Socket.IO for the logged-in guest and merges `message.new` into
 * the React Query message cache for the open booking thread.
 */
export function useGuestChatSocket(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return
    const token = getAccessToken()
    if (!token) return

    const ns = io(getWsUrl(), {
      transports: ['websocket', 'polling'],
      auth: { token },
    })
    sharedSocket = ns

    ns.on('message.new', (payload: ChatMessage) => {
      if (!payload?.conversationId) return
      queryClient.setQueryData<ChatMessage[]>(
        guestChatKeys.messages(payload.conversationId),
        (prev) => {
          if (!prev) return [payload]
          if (prev.some((m) => m.id === payload.id)) return prev
          const tempIdx = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              m.body === payload.body &&
              (m.senderClientId === payload.senderClientId ||
                m.senderStaffId === payload.senderStaffId),
          )
          if (tempIdx >= 0) {
            const next = [...prev]
            next[tempIdx] = payload
            return next
          }
          return [...prev, payload]
        },
      )
    })

    ns.on('message.translated', (payload: ChatMessage) => {
      if (!payload?.conversationId || !payload.id) return
      queryClient.setQueryData<ChatMessage[]>(
        guestChatKeys.messages(payload.conversationId),
        (prev) => {
          if (!prev) return prev
          return prev.map((m) => (m.id === payload.id ? { ...m, ...payload } : m))
        },
      )
    })

    return () => {
      ns.disconnect()
      if (sharedSocket === ns) sharedSocket = null
    }
  }, [enabled, queryClient])
}
