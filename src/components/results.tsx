"use client"

import { Button } from '@/components/ui'
import { CheckCircle, Target, X, Trophy, RotateCcw, Lightbulb, TrendingUp, TrendingDown, Minus, Circle } from 'lucide-react'
import { SKILL_LABELS, DIFFICULTY_LABEL, type Analysis, type Attempt, type Skills } from '@/lib/attempts'

function Delta({ now, before }: { now: number; before?: number }) {
  if (before === undefined) return null
  const d = now - before
  if (d === 0) return <span className="inline-flex items-center gap-0.5 text-xs text-slate-400"><Minus className="h-3 w-3" />same</span>
  const up = d > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-400' : 'text-orange-400'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}{d}
    </span>
  )
}

export function ResultsModal({
  analysis,
  previous,
  attemptNumber,
  personaName,
  onClose,
  onAgain,
}: {
  analysis: Analysis
  previous?: Attempt
  attemptNumber: number
  personaName: string
  onClose: () => void
  onAgain: () => void
}) {
  const found = analysis.truths.filter(t => t.found).length
  const prevFound = previous?.truthsFound

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600 flex flex-col">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-400" />
              Interview Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1">Attempt {attemptNumber} with {personaName}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score + progress vs last attempt */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-5 bg-slate-700/50 rounded-xl border border-slate-600">
              <div className="text-sm font-medium text-purple-400 uppercase tracking-wide">Overall Score</div>
              <div className="text-5xl font-bold text-white mt-2">{analysis.score}/10</div>
              <div className="mt-1 h-5"><Delta now={analysis.score} before={previous?.score} /></div>
              {previous && <div className="text-xs text-slate-500">vs last attempt ({previous.score}/10)</div>}
            </div>
            <div className="text-center p-5 bg-slate-700/50 rounded-xl border border-slate-600">
              <div className="text-sm font-medium text-purple-400 uppercase tracking-wide">Truths Uncovered</div>
              <div className="text-5xl font-bold text-white mt-2">{found}/{analysis.truths.length}</div>
              <div className="mt-1 h-5"><Delta now={found} before={prevFound} /></div>
              {previous && <div className="text-xs text-slate-500">vs last attempt ({prevFound}/{previous.truthsTotal})</div>}
            </div>
          </div>

          {/* Goal from last time */}
          {analysis.focusMet && previous?.nextFocus && (
            <div className={`p-4 rounded-lg border text-sm ${analysis.focusMet.met ? 'bg-green-900/20 border-green-800/40' : 'bg-orange-900/20 border-orange-800/40'}`}>
              <div className={`font-semibold mb-1 ${analysis.focusMet.met ? 'text-green-400' : 'text-orange-400'}`}>
                {analysis.focusMet.met ? 'Goal met' : 'Goal not met yet'}: {previous.nextFocus}
              </div>
              <div className="text-slate-300">{analysis.focusMet.comment}</div>
            </div>
          )}

          {/* Skills */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Your Skills</h3>
            <div className="space-y-3">
              {(Object.keys(SKILL_LABELS) as (keyof Skills)[]).map(k => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{SKILL_LABELS[k]}</span>
                    <span className="flex items-center gap-2 text-slate-200">
                      <Delta now={analysis.skills[k]} before={previous?.skills?.[k]} />
                      <span className="font-semibold w-8 text-right">{analysis.skills[k]}/10</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${analysis.skills[k] * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden truths */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">What {personaName.split(' ')[0]} Was Hiding</h3>
            <p className="text-xs text-slate-400 mb-3">Real problems sit under the surface. Here is what you uncovered and what you missed.</p>
            <ul className="space-y-2">
              {analysis.truths.map(t => (
                <li
                  key={t.id}
                  className={`p-3 rounded-lg border text-sm ${t.found ? 'bg-green-900/20 border-green-800/30' : 'bg-slate-700/40 border-slate-600'}`}
                >
                  <div className="flex gap-2 items-start">
                    {t.found
                      ? <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      : <Circle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />}
                    <div>
                      <div className={t.found ? 'text-green-300 font-medium' : 'text-slate-300 font-medium'}>{t.label}</div>
                      {t.found
                        ? t.evidence && <div className="text-slate-400 mt-1 italic">&ldquo;{t.evidence}&rdquo;</div>
                        : <div className="text-slate-400 mt-1"><span className="text-purple-300">Try:</span> {t.hint}</div>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Better question */}
          {analysis.betterQuestion && (
            <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-800/40">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4" /> A Stronger Version of Your Question
              </h3>
              <div className="text-sm text-slate-300"><span className="text-slate-500">You asked:</span> &ldquo;{analysis.betterQuestion.original}&rdquo;</div>
              <div className="text-sm text-slate-100 mt-1"><span className="text-purple-300">Try:</span> &ldquo;{analysis.betterQuestion.improved}&rdquo;</div>
              <div className="text-xs text-slate-400 mt-2">{analysis.betterQuestion.why}</div>
            </div>
          )}

          {/* Strengths */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5" /> Strengths
            </h3>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-200 bg-green-900/20 p-3 rounded-lg border border-green-800/30">
                  <span className="text-green-400 font-bold">•</span> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Improvements */}
          <div>
            <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2 mb-3">
              <Target className="h-5 w-5" /> Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-200 bg-orange-900/20 p-3 rounded-lg border border-orange-800/30">
                  <span className="text-orange-400 font-bold">•</span> {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Next focus */}
          {analysis.nextFocus && (
            <div className="p-4 rounded-lg bg-purple-600/20 border border-purple-500/50">
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-1">Your goal for the next interview</div>
              <div className="text-white font-medium">{analysis.nextFocus}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-700/30 rounded-b-xl flex justify-end gap-3">
          <Button onClick={onClose} variant="ghost" className="text-slate-300 hover:bg-slate-700">
            Review Chat
          </Button>
          <Button onClick={onAgain} className="bg-purple-600 hover:bg-purple-700 text-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            Interview Again
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProgressModal({ name, attempts, onClose }: { name: string; attempts: Attempt[]; onClose: () => void }) {
  const recent = attempts.slice(-10)
  const best = attempts.reduce((m, a) => Math.max(m, a.score), 0)
  const avgFirst = attempts.slice(0, 3)
  const avgLast = attempts.slice(-3)
  const mean = (xs: Attempt[]) => xs.reduce((s, a) => s + a.score, 0) / (xs.length || 1)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">My Progress</h2>
            <p className="text-xs text-slate-400 mt-1">{name} &middot; {attempts.length} interview{attempts.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {attempts.length === 0 ? (
            <p className="text-slate-300 text-sm">No finished interviews yet. Finish one with &ldquo;I&apos;m Done&rdquo; and your score will show up here.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-xs text-slate-400 uppercase">Best</div>
                  <div className="text-2xl font-bold text-white">{best}/10</div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-xs text-slate-400 uppercase">Latest</div>
                  <div className="text-2xl font-bold text-white">{attempts[attempts.length - 1].score}/10</div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-xs text-slate-400 uppercase">Trend</div>
                  <div className="text-2xl font-bold text-white">
                    {attempts.length >= 4
                      ? <Delta now={Math.round(mean(avgLast))} before={Math.round(mean(avgFirst))} />
                      : <span className="text-slate-500 text-base">—</span>}
                  </div>
                </div>
              </div>

              {/* Score bars */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Score by attempt</h3>
                <div className="flex items-end gap-2 h-32 border-b border-slate-600 pb-1">
                  {recent.map((a, i) => (
                    <div key={a.id} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-xs text-slate-300 mb-1">{a.score}</div>
                      <div className="w-full bg-purple-500 rounded-t" style={{ height: `${Math.max(a.score * 10, 4)}%` }} />
                      <div className="text-[10px] text-slate-500 mt-1">#{attempts.length - recent.length + i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">History</h3>
                <ul className="space-y-2">
                  {[...attempts].reverse().map((a, i) => (
                    <li key={a.id} className="p-3 bg-slate-700/40 rounded-lg border border-slate-600 text-sm">
                      <div className="flex justify-between text-slate-200">
                        <span className="font-medium">#{attempts.length - i} {a.personaName}</span>
                        <span className="font-semibold">{a.score}/10</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(a.date).toLocaleDateString()} &middot; {DIFFICULTY_LABEL[a.difficulty]} &middot; {a.truthsFound}/{a.truthsTotal} truths uncovered
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-700/30 rounded-b-xl flex justify-end">
          <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white">Close</Button>
        </div>
      </div>
    </div>
  )
}
