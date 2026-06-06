// src/components/exam/TimerBar.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface TimerBarProps {
  durasiMenit: number
  startedAt: Date
  onTimeUp: () => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerBar({ durasiMenit, startedAt, onTimeUp }: TimerBarProps) {
  const totalSeconds = durasiMenit * 60

  const getRemainingSeconds = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    return Math.max(0, totalSeconds - elapsed)
  }, [startedAt, totalSeconds])

  const [remaining, setRemaining] = useState(getRemainingSeconds)

  useEffect(() => {
    const interval = setInterval(() => {
      const sisa = getRemainingSeconds()
      setRemaining(sisa)
      if (sisa === 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [getRemainingSeconds, onTimeUp])

  const progressPct = (remaining / totalSeconds) * 100
  const isWarning = remaining <= 300  // 5 menit
  const isDanger = remaining <= 60    // 1 menit

  const barColor = isDanger
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-indigo-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div
          className={`flex items-center gap-1.5 font-mono font-medium tabular-nums ${
            isDanger
              ? 'text-rose-400'
              : isWarning
              ? 'text-amber-400'
              : 'text-slate-300'
          }`}
        >
          {isDanger ? (
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          {formatTime(remaining)}
        </div>
        <span className="text-slate-500">{durasiMenit} menit</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor} ${
            isDanger ? 'animate-pulse' : ''
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
