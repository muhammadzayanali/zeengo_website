import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthContext'
import { BrandMark } from '@/components/ui/BrandMark'
import { ZeenLoader } from '@/components/ui/ZeenLoader'
import { guestChatApi, guestChatKeys } from '@/shared/chat/chat.api'
import {
  CHAT_LANES,
  laneLabel,
  laneMeta,
  messageMatchesLane,
  type ClientChatRole,
  type ChatMessage,
} from '@/shared/chat/types'
import { getGuestChatSocket } from '@/shared/chat/useGuestChatSocket'

function elapsedLabel(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function formatClock(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return elapsedLabel(iso)
  }
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 12.5 19 5l-4.8 14.2-2.7-5.4L4.5 12.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

type Props = {
  bookingId: string
  /** @deprecated Prefer sheet launcher — kept for rare inline embeds */
  compact?: boolean
  /** Fill a modal/sheet (no outer card chrome). */
  sheet?: boolean
  /** Driver lane unlocked after assignment is accepted+ */
  driverChatReady?: boolean
  onClose?: () => void
}

export function GuestChatPanel({
  bookingId,
  compact = false,
  sheet = false,
  driverChatReady = false,
  onClose,
}: Props) {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  const [lane, setLane] = useState<ClientChatRole>('admin')
  const [text, setText] = useState('')
  const [typingLabel, setTypingLabel] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingEmit = useRef(0)

  useEffect(() => {
    if (!driverChatReady && lane === 'driver') setLane('admin')
  }, [driverChatReady, lane])

  const threadQ = useQuery({
    queryKey: guestChatKeys.thread(bookingId),
    queryFn: () => guestChatApi.bookingThread(bookingId, accessToken),
    enabled: Boolean(bookingId && accessToken),
    staleTime: 30_000,
  })

  const conversationId = threadQ.data?.id ?? ''

  const messagesQ = useQuery({
    queryKey: guestChatKeys.messages(conversationId),
    queryFn: ({ signal }) =>
      guestChatApi.messages(conversationId, { limit: 100 }, accessToken, signal),
    enabled: Boolean(conversationId && accessToken),
    staleTime: 4_000,
    refetchInterval: 45_000,
  })

  const allMessages = messagesQ.data ?? []

  const laneMessages = useMemo(
    () => allMessages.filter((m) => messageMatchesLane(m, lane)),
    [allMessages, lane],
  )

  const unreadByLane = useMemo(() => {
    const counts: Record<ClientChatRole, number> = {
      admin: 0,
      driver: 0,
      splizer: 0,
    }
    for (const m of allMessages) {
      if (m.senderType !== 'staff' && m.senderType !== 'system') continue
      if (m.senderClientId && user?.id && m.senderClientId === user.id) continue
      const role = (m.senderRole ?? 'admin') as ClientChatRole
      if (role !== lane) counts[role] += 1
    }
    return counts
  }, [allMessages, lane, user?.id])

  const active = laneMeta(lane)

  useEffect(() => {
    if (!conversationId) return
    const socket = getGuestChatSocket()
    socket?.emit('chat.join', { conversationId })
    return () => {
      socket?.emit('chat.leave', { conversationId })
    }
  }, [conversationId])

  useEffect(() => {
    const socket = getGuestChatSocket()
    if (!socket || !conversationId) return
    const onTyping = (payload: {
      conversationId?: string
      userId?: string
    }) => {
      if (payload.conversationId !== conversationId) return
      if (payload.userId === user?.id) return
      setTypingLabel(`${laneLabel(lane)} is typing…`)
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setTypingLabel(null), 2200)
    }
    socket.on('chat.typing', onTyping)
    return () => {
      socket.off('chat.typing', onTyping)
    }
  }, [conversationId, user?.id, lane])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [laneMessages.length, typingLabel, lane])

  useEffect(() => {
    if (!conversationId || !laneMessages.length) return
    const last = [...laneMessages].reverse().find((m) => !m.id.startsWith('temp-'))
    if (!last) return
    void guestChatApi.markRead(conversationId, last.id, accessToken).catch(() => undefined)
  }, [conversationId, laneMessages, accessToken])

  const send = useMutation({
    mutationFn: ({ body }: { body: string; tempId: string }) =>
      guestChatApi.sendMessage(conversationId, body, lane, accessToken),
    onMutate: async ({ body, tempId }) => {
      setText('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        body,
        createdAt: new Date().toISOString(),
        senderType: 'client',
        senderRole: lane,
        senderClientId: user?.id ?? null,
        senderStaffId: null,
        senderName: user?.fullName ?? null,
      }
      await qc.cancelQueries({ queryKey: guestChatKeys.messages(conversationId) })
      const previous = qc.getQueryData<ChatMessage[]>(
        guestChatKeys.messages(conversationId),
      )
      qc.setQueryData<ChatMessage[]>(
        guestChatKeys.messages(conversationId),
        (prev) => [...(prev ?? []), optimistic],
      )
      return { previous, tempId }
    },
    onSuccess: (msg, { tempId }) => {
      qc.setQueryData<ChatMessage[]>(
        guestChatKeys.messages(conversationId),
        (prev) => {
          if (!prev) return [msg]
          return [...prev.filter((m) => m.id !== tempId && m.id !== msg.id), msg]
        },
      )
      void guestChatApi.markRead(conversationId, msg.id, accessToken).catch(() => undefined)
      inputRef.current?.focus()
    },
    onError: (_err, { body }, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(guestChatKeys.messages(conversationId), ctx.previous)
      } else {
        qc.setQueryData<ChatMessage[]>(
          guestChatKeys.messages(conversationId),
          (prev) => prev?.filter((m) => m.id !== ctx?.tempId),
        )
      }
      setText(body)
    },
  })

  function onType(value: string) {
    setText(value)
    if (!conversationId || !value.trim()) return
    const now = Date.now()
    if (now - lastTypingEmit.current < 900) return
    lastTypingEmit.current = now
    getGuestChatSocket()?.emit('chat.typing', { conversationId })
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  function submit() {
    const body = text.trim()
    if (!body || !conversationId || send.isPending) return
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    send.mutate({ body, tempId })
  }

  const shellH = sheet
    ? 'h-full min-h-0'
    : compact
      ? 'min-h-[22rem] h-[min(28rem,68vh)]'
      : 'min-h-[26rem] h-[min(34rem,72vh)]'

  if (threadQ.isLoading) {
    return (
      <div
        className={`flex ${shellH} items-center justify-center ${
          sheet ? 'bg-paper' : 'rounded-[22px] border border-bord bg-paper shadow-[var(--shadow-card)]'
        }`}
        role="status"
        aria-label="Loading chat"
      >
        <ZeenLoader size="md" />
      </div>
    )
  }

  if (threadQ.isError || !threadQ.data) {
    return (
      <div
        className={
          sheet
            ? 'flex h-full flex-col justify-center bg-paper px-5 py-6'
            : 'rounded-[22px] border border-bord bg-paper px-5 py-6 shadow-[var(--shadow-card)]'
        }
      >
        <p className="text-[15px] font-bold text-graph">Chat unavailable</p>
        <p className="mt-1 text-[13px] leading-relaxed text-sgraph">
          {threadQ.error instanceof Error
            ? threadQ.error.message
            : 'We could not open your trip thread. Try again.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void threadQ.refetch()}
            className="inline-flex min-h-11 items-center rounded-[14px] bg-emer px-4 text-[13px] font-semibold text-white"
          >
            Retry
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-[14px] border border-bord px-4 text-[13px] font-semibold text-sgraph"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <section
      className={`flex ${shellH} flex-col overflow-hidden bg-paper ${
        sheet ? '' : 'rounded-[22px] border border-bord shadow-[var(--shadow-lift)]'
      }`}
      aria-label="Trip chat"
    >
      {/* Header */}
      <header className="relative shrink-0 overflow-hidden border-b border-bord bg-gradient-to-br from-mist via-paper to-[#f7f3ea] px-4 pb-3 pt-3">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-mint/50 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <BrandMark size={40} rounded="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.18em] text-emer uppercase">
              Messages
            </p>
            <h2 className="mt-0.5 truncate text-[17px] font-bold tracking-[-0.3px] text-graph">
              {active.label}
            </h2>
            <p className="mt-0.5 truncate text-[12.5px] text-sgraph">
              {threadQ.data.znCode ? `${threadQ.data.znCode} · ` : ''}
              {active.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold text-forest shadow-[var(--shadow-card)] ring-1 ring-bord">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fresh" aria-hidden />
              Live
            </span>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-bord bg-paper text-sgraph shadow-[var(--shadow-card)]"
                aria-label="Close chat"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 3l8 8M11 3 3 11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Contact chips */}
        <div
          className="relative mt-3.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Who to message"
        >
          {CHAT_LANES.map((tab) => {
            const selected = lane === tab.role
            const unread = unreadByLane[tab.role]
            const locked = tab.role === 'driver' && !driverChatReady
            return (
              <button
                key={tab.role}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={locked}
                title={
                  locked
                    ? 'Driver chat unlocks after your driver confirms'
                    : undefined
                }
                onClick={() => {
                  if (locked) return
                  setLane(tab.role)
                  inputRef.current?.focus()
                }}
                className={
                  locked
                    ? 'flex shrink-0 cursor-not-allowed items-center gap-2.5 rounded-[16px] border border-bord bg-ivory/80 px-3 py-2 text-left text-sgraph opacity-60'
                    : selected
                      ? 'flex shrink-0 items-center gap-2.5 rounded-[16px] bg-forest px-3 py-2 text-left text-white shadow-[0_6px_16px_rgba(18,55,42,0.22)] transition'
                      : 'flex shrink-0 items-center gap-2.5 rounded-[16px] border border-bord bg-paper/90 px-3 py-2 text-left text-graph shadow-[var(--shadow-card)] transition hover:border-emer/35'
                }
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${tab.accent} ${
                    selected ? 'ring-2 ring-white/35' : ''
                  }`}
                  aria-hidden
                >
                  {tab.initials}
                </span>
                <span className="pr-0.5">
                  <span
                    className={`block text-[13px] font-semibold leading-tight ${
                      selected ? 'text-white' : 'text-graph'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <span
                    className={`block text-[10.5px] leading-tight ${
                      selected ? 'text-white/75' : 'text-sgraph'
                    }`}
                  >
                    {tab.role === 'admin' ? 'Desk' : tab.role === 'driver' ? 'Trip' : 'Local'}
                  </span>
                </span>
                {unread > 0 && !selected ? (
                  <span className="ms-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emer px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </header>

      {/* Thread */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f7faf8_0%,#faf9f5_55%,#ffffff_100%)] px-3 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #12372a 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
          aria-hidden
        />

        <div className="relative space-y-3">
          {messagesQ.isLoading ? (
            <div className="flex justify-center py-10" role="status" aria-label="Loading">
              <ZeenLoader size="sm" />
            </div>
          ) : null}

          {messagesQ.isError ? (
            <div className="rounded-[16px] border border-[#f0c9c9] bg-[#fff8f8] px-4 py-3 text-center text-[13px] text-[#9b2c2c]">
              Could not load messages
            </div>
          ) : null}

          {!messagesQ.isLoading && !messagesQ.isError && laneMessages.length === 0 ? (
            <div className="mx-auto flex max-w-[16.5rem] flex-col items-center px-2 py-8 text-center">
              <span
                className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-[15px] font-bold text-white shadow-[var(--shadow-card)] ${active.accent}`}
                aria-hidden
              >
                {active.initials}
              </span>
              <p className="text-[15px] font-bold tracking-[-0.2px] text-graph">
                {active.emptyTitle}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-sgraph">
                {active.emptyBody}
              </p>
              <button
                type="button"
                onClick={() => {
                  setText(`Hi ${active.label}, `)
                  inputRef.current?.focus()
                }}
                className="mt-4 rounded-full border border-bord bg-paper px-3.5 py-1.5 text-[12px] font-semibold text-forest shadow-[var(--shadow-card)]"
              >
                Start with a hello
              </button>
            </div>
          ) : null}

          {laneMessages.map((m, i) => {
            const mine = Boolean(
              m.senderClientId && user?.id && m.senderClientId === user.id,
            )
            const prev = laneMessages[i - 1]
            const prevMine = Boolean(
              prev?.senderClientId && user?.id && prev.senderClientId === user.id,
            )
            const showName = !mine && (!prev || prevMine || prev?.senderName !== m.senderName)

            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={
                    mine
                      ? 'max-w-[82%] rounded-[18px] rounded-br-[6px] bg-forest px-3.5 py-2.5 text-white shadow-[0_4px_14px_rgba(18,55,42,0.18)]'
                      : 'max-w-[82%] rounded-[18px] rounded-bl-[6px] border border-bord/80 bg-paper px-3.5 py-2.5 text-graph shadow-[var(--shadow-card)]'
                  }
                >
                  {showName ? (
                    <p
                      className={`mb-1 text-[11px] font-semibold ${
                        mine ? 'text-white/70' : 'text-emer'
                      }`}
                    >
                      {m.senderName ?? laneLabel(m.senderRole)}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-[14px] leading-[1.45]">
                    {m.body}
                  </p>
                  <p
                    className={`mt-1 text-end text-[10px] ${
                      mine ? 'text-white/55' : 'text-sgraph'
                    }`}
                  >
                    {formatClock(m.createdAt)}
                    {m.id.startsWith('temp-') ? ' · sending' : ''}
                  </p>
                </div>
              </div>
            )
          })}

          {typingLabel ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-[16px] rounded-bl-[6px] border border-bord bg-paper px-3 py-2 text-[12px] text-sgraph shadow-[var(--shadow-card)]">
                <span className="flex gap-0.5" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sgraph/50 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sgraph/50 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sgraph/50 [animation-delay:240ms]" />
                </span>
                {typingLabel}
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <form
        className="shrink-0 border-t border-bord bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="flex items-end gap-2 rounded-[20px] border border-bord bg-mist/60 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus-within:border-emer/50 focus-within:bg-paper focus-within:ring-2 focus-within:ring-mint">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => {
              onType(e.target.value)
              autoGrow(e.target)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Message ${active.label}…`}
            disabled={!conversationId || send.isPending}
            autoComplete="off"
            className="max-h-[120px] min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14.5px] leading-snug text-graph outline-none placeholder:text-sgraph/80"
            aria-label={`Message ${active.label}`}
          />
          <button
            type="submit"
            disabled={!text.trim() || !conversationId || send.isPending}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-emer text-white shadow-[0_4px_12px_rgba(31,107,79,0.35)] transition enabled:hover:bg-forest disabled:cursor-not-allowed disabled:bg-bord disabled:text-sgraph disabled:shadow-none"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-sgraph">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </section>
  )
}
