// src/hooks/useAntiCheat.ts
// =============================================================
// Custom hook: logika anti-cheat lengkap
// Menangani: fullscreen, tab-switch, keyboard blocker, violation logging
// =============================================================

'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CheatType } from '@/lib/supabase/types'

const MAX_VIOLATIONS = 3

interface AntiCheatOptions {
  studentId: string
  examId: string
  onForceSubmit: () => void      // Dipanggil saat pelanggaran melebihi batas
  onViolation: (type: CheatType, count: number) => void // Untuk update UI
}

interface AntiCheatState {
  isFullscreen: boolean
  violationCount: number
  isActive: boolean
}

export function useAntiCheat({
  studentId,
  examId,
  onForceSubmit,
  onViolation,
}: AntiCheatOptions) {
  const supabase = createClient()
  const violationCountRef = useRef(0)  // Ref untuk akses di dalam event listener
  const isActiveRef = useRef(false)

  const [state, setState] = useState<AntiCheatState>({
    isFullscreen: false,
    violationCount: 0,
    isActive: false,
  })

  // ---
  // Log pelanggaran ke Supabase & update counter
  // ---
  const recordViolation = useCallback(
    async (type: CheatType, keterangan?: string) => {
      // Fire-and-forget: tidak block UI
      supabase.from('cheat_logs').insert({
        student_id: studentId,
        exam_id: examId,
        jenis_pelanggaran: type,
        keterangan: keterangan ?? null,
      })

      violationCountRef.current += 1
      const newCount = violationCountRef.current

      setState((prev) => ({ ...prev, violationCount: newCount }))
      onViolation(type, newCount)

      if (newCount >= MAX_VIOLATIONS) {
        onForceSubmit()
      }
    },
    [studentId, examId, supabase, onViolation, onForceSubmit]
  )

  // ---
  // Fullscreen API
  // ---
  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      // Browser tertentu tidak support — abaikan, tetap lanjut
    }
  }, [])

  const handleFullscreenChange = useCallback(() => {
    const isFull = !!document.fullscreenElement
    setState((prev) => ({ ...prev, isFullscreen: isFull }))

    if (!isFull && isActiveRef.current) {
      recordViolation('keluar_fullscreen', 'Murid keluar dari mode fullscreen')
      // Coba masuk kembali ke fullscreen setelah jeda singkat
      setTimeout(requestFullscreen, 500)
    }
  }, [recordViolation, requestFullscreen])

  // ---
  // Visibility API — deteksi pindah tab / minimize
  // ---
  const handleVisibilityChange = useCallback(() => {
    if (!isActiveRef.current) return
    if (document.visibilityState === 'hidden') {
      recordViolation('pindah_tab', 'Murid berpindah tab atau meminimalkan jendela')
    }
  }, [recordViolation])

  // ---
  // Window blur — deteksi focus pindah ke aplikasi lain
  // ---
  const handleWindowBlur = useCallback(() => {
    if (!isActiveRef.current) return
    recordViolation('blur_window', 'Focus berpindah ke luar jendela ujian')
  }, [recordViolation])

  // ---
  // Keyboard & Mouse Blocker
  // ---
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      if (isActiveRef.current) {
        recordViolation('klik_kanan', 'Murid mencoba klik kanan')
      }
    },
    [recordViolation]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActiveRef.current) return

      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Blokir F12 dan Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if (
        e.key === 'F12' ||
        (modifier && e.shiftKey && e.key === 'I') ||
        (modifier && e.shiftKey && e.key === 'J') ||
        (modifier && e.key === 'U')
      ) {
        e.preventDefault()
        recordViolation('devtools_shortcut', `Shortcut DevTools: ${e.key}`)
        return
      }

      // Blokir Ctrl+C / Cmd+C
      if (modifier && e.key === 'c') {
        e.preventDefault()
        recordViolation('shortcut_copy', 'Murid mencoba menyalin teks')
        return
      }

      // Blokir Ctrl+V / Cmd+V
      if (modifier && e.key === 'v') {
        e.preventDefault()
        recordViolation('shortcut_paste', 'Murid mencoba menempel teks')
        return
      }

      // Blokir Escape (mencegah keluar fullscreen via keyboard)
      // Browser biasanya tidak bisa dicegah untuk Escape di fullscreen,
      // tapi handler fullscreenchange di atas yang akan menangkap exitnya.
    },
    [recordViolation]
  )

  // ---
  // Aktifkan semua listener
  // ---
  const activate = useCallback(async () => {
    isActiveRef.current = true
    await requestFullscreen()
    setState((prev) => ({ ...prev, isActive: true, isFullscreen: true }))
  }, [requestFullscreen])

  // ---
  // Pasang / lepas event listeners berdasarkan siklus hidup komponen
  // ---
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      isActiveRef.current = false
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleWindowBlur)
      // Keluar dari fullscreen saat komponen di-unmount (ujian selesai)
      if (document.fullscreenElement) document.exitFullscreen()
    }
  }, [
    handleFullscreenChange,
    handleVisibilityChange,
    handleContextMenu,
    handleKeyDown,
    handleWindowBlur,
  ])

  return {
    ...state,
    activate,
    recordViolation,
    maxViolations: MAX_VIOLATIONS,
  }
}
