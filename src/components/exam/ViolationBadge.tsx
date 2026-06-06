// src/components/exam/ViolationBadge.tsx
'use client'

import { ShieldAlert, ShieldCheck } from 'lucide-react'

interface ViolationBadgeProps {
  count: number
  max: number
}

export function ViolationBadge({ count, max }: ViolationBadgeProps) {
  const isClean = count === 0
  const isWarning = count > 0 && count < max
  const isDanger = count >= max

  const baseClass =
    'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors duration-300'

  const variantClass = isClean
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : isWarning
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse'

  return (
    <div className={`${baseClass} ${variantClass}`}>
      {isClean ? (
        <ShieldCheck className="w-3.5 h-3.5" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5" />
      )}
      <span>
        {isClean ? 'Aman' : `${count}/${max} Pelanggaran`}
      </span>
    </div>
  )
}
