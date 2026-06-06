// src/components/exam/ExamShell.tsx
// =============================================================
// Pembungkus halaman ujian. Mengintegrasikan useAntiCheat
// dan menampilkan overlay peringatan saat pelanggaran terjadi.
// =============================================================

'use client'

import { useState, useCallback, useTransition } from 'react'
import { AlertTriangle, ShieldCheck, ShieldX, Maximize2 } from 'lucide-react'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import type { CheatType } from '@/lib/supabase/types'
import { ViolationBadge } from './ViolationBadge'

interface ExamShellProps {
  studentId: string
  examId: string
  namaUjian: string
  onSubmit: () => Promise<void>
  children: React.ReactNode
}

interface ViolationAlert {
  type: CheatType
  count: number
}

export function ExamShell({
  studentId,
  examId,
  namaUjian,
  onSubmit,
  children,
}: ExamShellProps) {
  const [isPending, startTransition] = useTransition()
  const [violationAlert, setViolationAlert] = useState<ViolationAlert | null>(null)
  const [isForceSubmitting, setIsForceSubmitting] = useState(false)

  const handleForceSubmit = useCallback(() => {
    setIsForceSubmitting(true)
    startTransition(async () => {
      await onSubmit()
    })
  }, [onSubmit])

  const handleViolation = useCallback((type: CheatType, count: number) => {
    setViolationAlert({ type, count })
    // Hapus alert setelah 4 detik
    setTimeout(() => setViolationAlert(null), 4000)
  }, [])

  const {
    isFullscreen,
    violationCount,
    isActive,
    activate,
    maxViolations,
  } = useAntiCheat({
    studentId,
    examId,
    onForceSubmit: handleForceSubmit,
    onViolation: handleViolation,
  })

  // --- Layar Mulai Ujian (sebelum fullscreen diaktifkan) ---
  if (!isActive) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-slate-100">{namaUjian}</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sebelum memulai, baca ketentuan berikut dengan seksama. Browser akan
              memasuki mode layar penuh dan setiap pelanggaran akan dicatat.
            </p>
          </div>
          <ul className="text-left space-y-2 text-sm text-slate-400">
            {[
              'Jangan keluar dari mode layar penuh',
              'Dilarang berpindah tab atau aplikasi',
              'Klik kanan dan shortcut keyboard dinonaktifkan',
              `Pelanggaran lebih dari ${maxViolations} kali = ujian dikumpulkan otomatis`,
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={activate}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-150"
          >
            <Maximize2 className="w-4 h-4" />
            Mulai Ujian
          </button>
        </div>
      </div>
    )
  }

  // --- Overlay Force Submit ---
  if (isForceSubmitting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-rose-950 border border-rose-800 rounded-2xl p-8 text-center space-y-4">
          <ShieldX className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-semibold text-rose-200">Ujian Dihentikan</h2>
          <p className="text-rose-300/70 text-sm">
            Batas pelanggaran tercapai. Jawaban Anda sedang dikumpulkan secara
            otomatis.
          </p>
          {isPending && (
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 select-none">
      {/* Header Status */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          {isFullscreen ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-slate-400 hidden sm:inline">{namaUjian}</span>
        </div>

        <ViolationBadge count={violationCount} max={maxViolations} />
      </header>

      {/* Konten ujian */}
      <main>{children}</main>

      {/* Peringatan pelanggaran (toast) */}
      {violationAlert && (
        <ViolationToast
          type={violationAlert.type}
          count={violationAlert.count}
          max={maxViolations}
        />
      )}
    </div>
  )
}

// --- Toast Pelanggaran ---
function ViolationToast({
  type,
  count,
  max,
}: {
  type: CheatType
  count: number
  max: number
}) {
  const label: Record<CheatType, string> = {
    keluar_fullscreen: 'Anda keluar dari mode layar penuh',
    pindah_tab: 'Perpindahan tab terdeteksi',
    blur_window: 'Jendela kehilangan fokus',
    klik_kanan: 'Klik kanan tidak diizinkan',
    shortcut_copy: 'Menyalin teks tidak diizinkan',
    shortcut_paste: 'Menempel teks tidak diizinkan',
    devtools_shortcut: 'Akses DevTools tidak diizinkan',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs w-full bg-rose-950 border border-rose-800 rounded-xl p-4 shadow-2xl shadow-rose-900/50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-rose-200">{label[type]}</p>
          <p className="text-xs text-rose-400">
            Pelanggaran {count} dari {max} — melebihi batas akan mengumpulkan ujian
            otomatis
          </p>
        </div>
      </div>
    </div>
  )
}
