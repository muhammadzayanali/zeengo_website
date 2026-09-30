import { apiRequest } from '@/shared/api/client'
import type { ChatMessage, ClientChatRole, Conversation } from './types'

export const guestChatKeys = {
  all: ['guest-chat'] as const,
  thread: (bookingId: string) =>
    [...guestChatKeys.all, 'thread', bookingId] as const,
  messages: (conversationId: string) =>
    [...guestChatKeys.all, 'messages', conversationId] as const,
}

export const guestChatApi = {
  bookingThread(bookingId: string, token?: string | null) {
    return apiRequest<Conversation>(`/chat/bookings/${bookingId}/thread`, {
      method: 'POST',
      token,
    })
  },

  messages(
    conversationId: string,
    params?: { before?: string; limit?: number },
    token?: string | null,
    signal?: AbortSignal,
  ) {
    const q = new URLSearchParams()
    if (params?.before) q.set('before', params.before)
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiRequest<ChatMessage[]>(
      `/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
      { method: 'GET', token, signal },
    )
  },

  sendMessage(
    conversationId: string,
    body: string,
    senderRole: ClientChatRole,
    token?: string | null,
  ) {
    return apiRequest<ChatMessage>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: { body, senderRole },
        token,
      },
    )
  },

  markRead(
    conversationId: string,
    lastMessageId: string,
    token?: string | null,
  ) {
    return apiRequest<{ read: boolean }>(
      `/chat/conversations/${conversationId}/read`,
      {
        method: 'POST',
        body: { lastMessageId },
        token,
      },
    )
  },
}
