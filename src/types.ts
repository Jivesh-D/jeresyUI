export interface Player {
  jerseyNumber: string
  name: string
  tagLine: string
}

export function emptyPlayer(): Player {
  return { jerseyNumber: '', name: '', tagLine: '' }
}
