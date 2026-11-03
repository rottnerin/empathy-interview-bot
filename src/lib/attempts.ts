import type { Difficulty } from './personas'

export type Skills = {
  openEnded: number
  followUps: number
  neutrality: number
  depth: number
  rapport: number
}

export type Analysis = {
  score: number
  skills: Skills
  strengths: string[]
  weaknesses: string[]
  truths: { id: string; label: string; hint: string; found: boolean; evidence: string }[]
  nextFocus: string
  betterQuestion: { original: string; improved: string; why: string } | null
  focusMet: { met: boolean; comment: string } | null
}

export type Attempt = {
  id: string
  date: string
  personaId: string
  personaName: string
  difficulty: Difficulty
  score: number
  skills: Skills
  truthsFound: number
  truthsTotal: number
  nextFocus: string
  focusMet: boolean | null
}

export const SKILL_LABELS: Record<keyof Skills, string> = {
  openEnded: 'Open-ended questions',
  followUps: 'Follow-ups & stories',
  neutrality: 'Staying neutral',
  depth: 'Emotional depth',
  rapport: 'Rapport',
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Friendly',
  normal: 'Realistic',
  hard: 'Guarded',
}

// Interviewees get harder as the student gets more practice
export function difficultyForAttempt(attemptNumber: number): Difficulty {
  if (attemptNumber <= 2) return 'easy'
  if (attemptNumber <= 5) return 'normal'
  return 'hard'
}

const attemptsKey = (name: string) => `empathy-attempts:${name.trim().toLowerCase()}`

export function loadAttempts(name: string): Attempt[] {
  try {
    const raw = localStorage.getItem(attemptsKey(name))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAttempt(name: string, attempt: Attempt) {
  try {
    const all = loadAttempts(name)
    all.push(attempt)
    localStorage.setItem(attemptsKey(name), JSON.stringify(all))
  } catch {
    // Storage unavailable (private mode); progress just won't persist
  }
}
