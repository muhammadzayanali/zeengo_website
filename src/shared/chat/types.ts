/** Guest chat channels — Support tab uses `admin` on the wire. */
export type ClientChatRole = 'admin' | 'driver' | 'splizer'

export type Conversation = {
  id: string
  type: string
  title: string | null
  bookingId: string | null
  createdAt: string
  lastMessageAt: string | null
  unreadCount: number
  znCode?: string | null
  clientName?: string | null
}

export type ChatMessage = {
  id: string
  conversationId: string
  body: string
  createdAt: string
  senderType?: string
  senderRole?: ClientChatRole | null
  senderName?: string | null
  senderStaffId?: string | null
  senderClientId?: string | null
  bodyTranslated?: Record<string, string>
}

export const CHAT_LANES: {
  role: ClientChatRole
  label: string
  subtitle: string
  emptyTitle: string
  emptyBody: string
  initials: string
  accent: string
}[] = [
  {
    role: 'admin',
    label: 'Support',
    subtitle: 'ZEEN desk · usually replies fast',
    emptyTitle: 'Ask the ZEEN desk',
    emptyBody: 'Dates, hotels, food, or anything about your trip — Support is here.',
    initials: 'ZN',
    accent: 'from-[#1f6b4f] to-[#12372a]',
  },
  {
    role: 'driver',
    label: 'Driver',
    subtitle: 'Your trip driver',
    emptyTitle: 'Message your driver',
    emptyBody: 'Pickup timing, meeting point, or a quick note on the road.',
    initials: 'DR',
    accent: 'from-[#3e8e68] to-[#1f6b4f]',
  },
  {
    role: 'splizer',
    label: 'Splizer',
    subtitle: 'On-ground specialist',
    emptyTitle: 'Reach your Splizer',
    emptyBody: 'Local tips and help while you are out exploring.',
    initials: 'SP',
    accent: 'from-[#c7a96b] to-[#8a7342]',
  },
]

export function laneLabel(role: ClientChatRole | null | undefined): string {
  if (role === 'driver') return 'Driver'
  if (role === 'splizer') return 'Splizer'
  return 'Support'
}

export function laneMeta(role: ClientChatRole) {
  return CHAT_LANES.find((l) => l.role === role) ?? CHAT_LANES[0]
}

/** Messages with no channel land in Support (legacy rows). */
export function messageMatchesLane(
  msg: ChatMessage,
  lane: ClientChatRole,
): boolean {
  const role = msg.senderRole ?? 'admin'
  return role === lane
}
