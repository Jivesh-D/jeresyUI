export const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const
export type JerseySize = (typeof JERSEY_SIZES)[number]

export interface Player {
  jerseyNumber: string
  name: string
  tagLine: string
  jerseySize: JerseySize | ''
}

export function emptyPlayer(): Player {
  return { jerseyNumber: '', name: '', tagLine: '', jerseySize: '' }
}
