// src/app/exam/[examId]/ExamClient.tsx
'use client'

import { useState, useCallback, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Send, LayoutGrid } from 'lucide-react'
import { ExamShell } from '@/components/exam/ExamShell'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { TimerBar } from '@/components/exam/TimerBar'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type StudentAnswerInsert = Database['public']['Tables']['student_answers']['Insert']
type ExamResultUpdate = Database['public']['Tables']['exam_results']['Update']

interface QuestionOption {
  id: string
  teks_opsi: string
  is_correct: boolean
}

interface Question {
  id: string
  teks_soal: string
  urutan: number
  question_options: QuestionOption[]
}

interface ExamClientProps {
  exam: {
    id: string
    nama_ujian: string
    waktu_mulai: string
    durasi_menit: number
    questions: Question[]
  }
  student: { id: string; nama: string; kelas: string }
  examResultId: string
}

export function ExamClient({ exam, student, examResultId }: ExamClientProps) {
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startedAt] = useState(() => new Date())
  const [showGrid, setShowGrid] = useState(false)

  const currentQuestion = exam.questions[currentIndex]
  const totalQuestions = exam.questions.length

  const handleAnswer = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
      startTransition(async () => {
        const payload: StudentAnswerInsert = {
          exam_result_id: examResultId,
          question_id: questionId,
          selected_option_id: optionId,
        }
        await supabase
          .from('student_answers')
          .upsert(payload, { onConflict: 'exam_result_id,question_id' })
      })
    },
    [supabase, examResultId]
  )

  const handleSubmit = useCallback(async () => {
    const correctCount = exam.questions.reduce((acc, q) => {
      const selected = answers[q.id]
      const correct = q.question_options.some((o) => o.id === selected && o.is_correct)
      return acc + (correct ? 1 : 0)
    }, 0)

    const skor = Math.round((correctCount / totalQuestions) * 100)

    const update: ExamResultUpdate = {
      status: 'selesai',
      total_skor: skor,
      selesai_at: new Date().toISOString(),
    }

    await supabase.from('exam_results').update(update).eq('id', examResultId)

    window.location.href = `/exam/result?examId=${exam.id}`
  }, [answers, exam, examResultId, supabase, totalQuestions])

  const answeredCount = Object.keys(answers).length

  return (
    <ExamShell
      studentId={student.id}
      examId={exam.id}
      namaUjian={exam.nama_ujian}
      onSubmit={handleSubmit}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <TimerBar
            durasiMenit={exam.durasi_menit}
            startedAt={startedAt}
            onTimeUp={handleSubmit}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-slate-300 font-medium">{student.nama}</span>
            <span className="text-slate-600 mx-1.5">·</span>
            <span className="text-slate-500">{student.kelas}</span>
          </div>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-xs">{answeredCount}/{totalQuestions}</span>
          </button>
        </div>

        {showGrid && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">
              Navigasi Soal
            </p>
            <div className="flex flex-wrap gap-2">
              {exam.questions.map((q, i) => {
                const isAnswered = !!answers[q.id]
                const isCurrent = i === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(i); setShowGrid(false) }}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : isAnswered
                        ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <QuestionCard
          nomor={currentIndex + 1}
          total={totalQuestions}
          teks_soal={currentQuestion.teks_soal}
          options={currentQuestion.question_options}
          selectedOptionId={answers[currentQuestion.id] ?? null}
          onSelect={(optionId) => handleAnswer(currentQuestion.id, optionId)}
        />

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Berikutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              Kumpulkan Ujian
            </button>
          )}
        </div>
      </div>
    </ExamShell>
  )
}
