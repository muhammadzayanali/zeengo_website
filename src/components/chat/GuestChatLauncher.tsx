import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { GuestChatPanel } from './GuestChatPanel'

type Props = {
  bookingId: string
  znCode?: string | null
  /** Compact row for Account; default is trip “Need help?” card */
  variant?: 'card' | 'row'
}

const STORAGE_KEY = 'zeengo.guestChatBall'
const BALL = 56
const EDGE_PAD = 12
const PANEL_GAP = 10

type BallPos = { x: number; y: number }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function bottomNavReserve() {
  if (typeof window === 'undefined') return 96
  return window.matchMedia('(min-width: 768px)').matches ? 24 : 96
}

function defaultPos(): BallPos {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return {
    x: window.innerWidth - BALL - EDGE_PAD,
    y: window.innerHeight - BALL - bottomNavReserve() - EDGE_PAD,
  }
}

function readStoredPos(): BallPos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BallPos
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredPos(pos: BallPos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    /* ignore */
  }
}

function clampToViewport(pos: BallPos): BallPos {
  const maxX = Math.max(EDGE_PAD, window.innerWidth - BALL - EDGE_PAD)
  const maxY = Math.max(
    EDGE_PAD,
    window.innerHeight - BALL - bottomNavReserve() - EDGE_PAD,
  )
  return {
    x: clamp(pos.x, EDGE_PAD, maxX),
    y: clamp(pos.y, EDGE_PAD, maxY),
  }
}

function snapToEdge(pos: BallPos): BallPos {
  const mid = window.innerWidth / 2
  const x =
    pos.x + BALL / 2 < mid
      ? EDGE_PAD
      : window.innerWidth - BALL - EDGE_PAD
  return clampToViewport({ x, y: pos.y })
}

/** Float chat panel near the AssistiveTouch ball (not a centered modal). */
function panelStyleFromBall(ball: BallPos): CSSProperties {
  const maxW = Math.min(400, window.innerWidth - EDGE_PAD * 2)
  const maxH = Math.min(
    580,
    window.innerHeight - EDGE_PAD * 2 - bottomNavReserve() * 0.35,
  )

  const preferLeft = ball.x + BALL / 2 > window.innerWidth / 2
  let left = preferLeft ? ball.x + BALL - maxW : ball.x
  left = clamp(left, EDGE_PAD, window.innerWidth - maxW - EDGE_PAD)

  // Prefer opening upward from the ball (chat-head style)
  let top = ball.y - PANEL_GAP - maxH
  if (top < EDGE_PAD) {
    top = ball.y + BALL + PANEL_GAP
  }
  if (top + maxH > window.innerHeight - EDGE_PAD) {
    top = clamp(EDGE_PAD, EDGE_PAD, window.innerHeight - maxH - EDGE_PAD)
  }

  return {
    position: 'fixed',
    left,
    top,
    width: maxW,
    height: maxH,
    zIndex: 60,
  }
}

/**
 * Trip stays clean. Draggable chat ball opens a panel anchored to the ball —
 * like Intercom / Messenger chat-heads, not a full-screen centered modal.
 */
export function GuestChatLauncher({
  bookingId,
  znCode,
  variant = 'card',
}: Props) {
  const [open, setOpen] = useState(false)
  const [ballPos, setBallPos] = useState<BallPos>(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    return clampToViewport(readStoredPos() ?? defaultPos())
  })
  const [panelBox, setPanelBox] = useState<CSSProperties>({})
  const titleId = useId()

  const openNearBall = useCallback((pos?: BallPos) => {
    const anchor = clampToViewport(pos ?? ballPos)
    setBallPos(anchor)
    setPanelBox(panelStyleFromBall(anchor))
    setOpen(true)
  }, [ballPos])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onResize = () => setPanelBox(panelStyleFromBall(ballPos))
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open, ballPos])

  const trigger =
    variant === 'row' ? (
      <button
        type="button"
        onClick={() => openNearBall()}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[18px] border border-bord bg-paper px-4 text-start shadow-[var(--shadow-card)] transition active:scale-[0.99]"
      >
        <span className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emer to-forest text-[12px] font-bold text-white"
            aria-hidden
          >
            ZN
          </span>
          <span>
            <span className="block text-[14px] font-semibold text-graph">
              Chat with ZEEN
            </span>
            <span className="block text-[12px] text-sgraph">
              Support · Driver · Splizer
            </span>
          </span>
        </span>
        <span className="text-sgraph" aria-hidden>
          ›
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => openNearBall()}
        className="group w-full rounded-[20px] border border-bord bg-gradient-to-br from-mist via-paper to-[#f7f3ea] p-4 text-start shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-lift)] active:scale-[0.995]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-emer uppercase">
              Need help?
            </p>
            <p className="mt-1 text-[17px] font-bold tracking-[-0.3px] text-graph">
              Message ZEEN
            </p>
            <p className="mt-1 max-w-[18rem] text-[13px] leading-relaxed text-sgraph">
              Chat with Support, your driver, or Splizer — without leaving{' '}
              {znCode ?? 'your trip'}.
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emer text-white shadow-[0_6px_16px_rgba(31,107,79,0.28)] transition group-hover:bg-forest">
            <ChatBubbleIcon />
          </span>
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          {[
            ['ZN', 'Support', 'from-[#1f6b4f] to-[#12372a]'],
            ['DR', 'Driver', 'from-[#3e8e68] to-[#1f6b4f]'],
            ['SP', 'Splizer', 'from-[#c7a96b] to-[#8a7342]'],
          ].map(([ini, label, accent]) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-bord bg-paper/90 py-1 pe-2.5 ps-1 text-[11px] font-semibold text-graph shadow-[var(--shadow-card)]"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white ${accent}`}
                aria-hidden
              >
                {ini}
              </span>
              {label}
            </span>
          ))}
        </div>
      </button>
    )

  return (
    <>
      {trigger}

      <AssistiveChatBall
        pos={ballPos}
        setPos={setBallPos}
        hidden={open}
        onOpen={() => openNearBall(ballPos)}
      />

      {open && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[55] bg-[#12372a]/20"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                style={panelBox}
                className="overflow-hidden rounded-[22px] border border-bord bg-paper shadow-[0_18px_50px_rgba(18,55,42,0.28)] animate-[chat-pop_180ms_cubic-bezier(0.22,1,0.36,1)]"
              >
                <span id={titleId} className="sr-only">
                  Trip chat
                </span>
                <GuestChatPanel
                  bookingId={bookingId}
                  sheet
                  onClose={() => setOpen(false)}
                />
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}

function AssistiveChatBall({
  pos,
  setPos,
  onOpen,
  hidden,
}: {
  pos: BallPos
  setPos: (p: BallPos | ((prev: BallPos) => BallPos)) => void
  onOpen: () => void
  hidden?: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setPos])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        moved: false,
      }
      setDragging(true)
    },
    [pos.x, pos.y],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const d = dragRef.current
      if (!d || d.pointerId !== e.pointerId) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true
      if (!d.moved) return
      setPos(
        clampToViewport({
          x: d.originX + dx,
          y: d.originY + dy,
        }),
      )
    },
    [setPos],
  )

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const d = dragRef.current
      if (!d || d.pointerId !== e.pointerId) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      dragRef.current = null
      setDragging(false)

      if (!d.moved) {
        onOpen()
        return
      }

      setPos((current) => {
        const snapped = snapToEdge(current)
        writeStoredPos(snapped)
        return snapped
      })
    },
    [onOpen, setPos],
  )

  if (typeof document === 'undefined' || hidden) return null

  return createPortal(
    <button
      type="button"
      aria-label="Open chat. Drag to move."
      title="Drag to move · tap to open chat"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: BALL,
        height: BALL,
        touchAction: 'none',
        zIndex: 45,
      }}
      className={`flex items-center justify-center rounded-full bg-forest text-white select-none ${
        dragging
          ? 'scale-110 cursor-grabbing shadow-[0_14px_32px_rgba(18,55,42,0.45)]'
          : 'cursor-grab shadow-[0_10px_28px_rgba(18,55,42,0.35)]'
      } transition-[transform,box-shadow] duration-150`}
    >
      <span className="pointer-events-none flex flex-col items-center gap-0.5">
        <ChatBubbleIcon />
        <span className="text-[9px] font-bold tracking-wide uppercase opacity-90">
          Chat
        </span>
      </span>
    </button>,
    document.body,
  )
}

function ChatBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 18.5 4 21l3-1.2A8.5 8.5 0 1 0 5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11h7M8.5 14h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
