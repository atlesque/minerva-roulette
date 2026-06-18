export const NAMES = ['Kris', 'Gilles', 'Tom', 'Alex'] as const

/** 2026-06-11 09:00 CET (UTC+1) = 07:00 UTC */
const EPOCH_MS = new Date('2026-06-11T07:00:00Z').getTime()
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function useWinner(date: Date = new Date()) {
  const diff = date.getTime() - EPOCH_MS
  const index = diff < 0 ? 0 : Math.floor(diff / WEEK_MS) % NAMES.length
  return {
    winnerIndex: index,
    winnerName: NAMES[index],
  }
}
