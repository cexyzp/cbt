// src/app/login/page.tsx
// Halaman login murid menggunakan NISN

'use client'

import { useState, useTransition } from 'react'
import { BookOpen, ArrowRight, AlertCircle, Lock } from 'lucide-react'
import { loginWithNISN } from '@/lib/auth/student'

export default function LoginPage() {
  const [nisn, setNisn] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = nisn.trim()
    if (!trimmed) {
      setError('Masukkan NISN Anda.')
      return
    }
    startTransition(async () => {
      const result = await loginWithNISN(trimmed)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, #94a3b8 39px, #94a3b8 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #94a3b8 39px, #94a3b8 40px)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50 mb-2">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            Portal Ujian
          </h1>
          <p className="text-slate-500 text-sm">
            Masuk menggunakan Nomor Induk Siswa Nasional
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-900/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="nisn"
                className="text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                NISN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="nisn"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={20}
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan NISN Anda"
                  disabled={isPending}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-800/60 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || nisn.length < 5}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-150"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Hubungi pengawas ujian jika mengalami masalah login.
        </p>
      </div>
    </div>
  )
}
