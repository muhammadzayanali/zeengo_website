/**
 * Design tokens from aLo Russia · ZEEN (Jola / client demo).
 * Use these when building native React screens that match the demo theme.
 */
export const aloTheme = {
  colors: {
    forest: '#12372A',
    emer: '#1F6B4F',
    fresh: '#3E8E68',
    mint: '#DDEDE5',
    mist: '#F3F8F5',
    ivory: '#FAF9F5',
    paper: '#FFFFFF',
    graph: '#17201C',
    sgraph: '#5F6964',
    bord: '#E5EAE7',
    champ: '#C7A96B',
    stage: '#0d120a',
  },
  radii: {
    btn: 16,
    card: 20,
    tile: 18,
    chip: 11,
    sheet: 26,
  },
  fonts: {
    sans: "'IBM Plex Sans Arabic', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display:
      "'IBM Plex Sans Arabic', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  breakpoints: {
    /** Legacy demo breakpoint note — production site is always full viewport (no phone frame). */
    mobileMax: 760,
  },
} as const

export type AloTheme = typeof aloTheme
