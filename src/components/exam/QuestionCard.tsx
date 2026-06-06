// src/components/exam/QuestionCard.tsx
'use client'

import { CheckCircle2, Circle } from 'lucide-react'

interface Option {
  id: string
  teks_opsi: string
}

interface QuestionCardProps {
  nomor: number
  total: number
  teks_soal: string
  options: Option[]
  selectedOptionId: string | null
  onSelect: (optionId: string) => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

export function QuestionCard({
  nomor,
  total,
  teks_soal,
  options,
  selectedOptionId,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Nomor soal */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white tabular-nums">{nomor}</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            dari {total} soal
          </span>
        </div>
      </div>

      {/* Teks soal */}
      <div className="px-6 py-5">
        <p className="text-slate-100 text-base leading-relaxed">{teks_soal}</p>
      </div>

      {/* Pilihan jawaban */}
      <div className="px-6 pb-6 space-y-2.5">
        {options.map((option, index) => {
          const isSelected = selectedOptionId === option.id
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 group ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Label A/B/C */}
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                }`}
              >
                {OPTION_LABELS[index]}
              </span>

              {/* Teks opsi */}
              <span className="flex-1 text-sm leading-relaxed">{option.teks_opsi}</span>

              {/* Ikon status */}
              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
