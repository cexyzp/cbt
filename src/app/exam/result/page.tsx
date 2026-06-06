// src/app/exam/result/page.tsx
// Halaman hasil ujian setelah submit

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStudentProfile } from '@/lib/auth/student'
import { CheckCircle2, XCircle, ShieldAlert, Trophy, LogOut } from 'lucide-react'
import { logout } from '@/lib/auth/student'

interface PageProps {
  searchParams: Promise<{ examId?: string }>
}

export default async function ResultPage({ searchParams }: PageProps) {
  const { examId } = await searchParams
  if (!examId) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const student = await getStudentProfile()
  if (!student) redirect('/login')

  const { data: result } = await supabase
    .from('exam_results')
    .select('total_skor, jumlah_pelanggaran, status, mulai_at, selesai_at')
    .eq('student_id', student.id)
    .eq('exam_id', examId)
    .single()

  const { data: exam } = await supabase
    .from('exams')
    .select('nama_ujian')
    .eq('id', examId)
    .single()

  if (!result || result.status !== 'selesai') redirect(`/exam/${examId}`)

  const isPassed = result.total_skor >= 75
  const durasiDetik = result.mulai_at && result.selesai_at
    ? Math.round((new Date(result.selesai_at).getTime() - new Date(result.mulai_at).getTime()) / 1000)
    : null

  const formatDurasi = (detik: number) => {
    const m = Math.floor(detik / 60)
    const s = detik % 60
    return `${m}m ${s}d`
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-4">
        {/* Header hasil */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isPassed
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              <Trophy
                className={`w-8 h-8 ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-slate-500 text-sm">{exam?.nama_ujian}</p>
            <div
              className={`text-5xl font-bold tabular-nums ${
                isPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.total_skor}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                isPassed
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {isPassed ? 'Lulus' : 'Tidak Lulus'}
            </div>
          </div>
        </div>

        {/* Detail statistik */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          {[
            { label: 'Peserta', value: student.nama },
            { label: 'Kelas', value: student.kelas },
            ...(durasiDetik !== null
              ? [{ label: 'Durasi Pengerjaan', value: formatDurasi(durasiDetik) }]
              : []),
            {
              label: 'Pelanggaran',
              value: result.jumlah_pelanggaran,
              icon:
                result.jumlah_pelanggaran > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                ) : null,
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-500">{item.label}</span>
              <div className="flex items-center gap-1.5">
                {(item as any).icon}
                <span className="text-sm font-medium text-slate-200">
                  {String(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </form>
      </div>
    </div>
  )
}
