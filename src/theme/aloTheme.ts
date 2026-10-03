/**
 * aLo Russia · ZEEN visual tokens.
 * Forest / emerald / champagne stay the brand. Display serif is for
 * editorial headlines (LTR); Arabic keeps IBM Plex throughout.
 */
export const aloTheme = {
  colors: {
    forest: '#12372A',
    emer: '#1F6B4F',
    fresh: '#3E8E68',
    mint: '#DDEDE5',
    mist: '#F1EBE1',
    ivory: '#F3EEE4',
    paper: '#FFFDF8',
    graph: '#1A1914',
    sgraph: '#6A655C',
    bord: '#E2D9CC',
    champ: '#C7A96B',
    stage: '#0d120a',
  },
  radii: {
    btn: 14,
    card: 14,
    tile: 12,
    chip: 999,
    sheet: 22,
  },
  fonts: {
    sans: "'IBM Plex Sans Arabic', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display:
      "'Fraunces', 'IBM Plex Sans Arabic', Georgia, 'Times New Roman', serif",
  },
  breakpoints: {
    /** Legacy demo breakpoint note — production site is always full viewport (no phone frame). */
    mobileMax: 760,
  },
} as const

export type AloTheme = typeof aloTheme
