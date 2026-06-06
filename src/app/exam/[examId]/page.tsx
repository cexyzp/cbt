// src/app/exam/[examId]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStudentProfile } from '@/lib/auth/student'
import { ExamClient } from './ExamClient'

interface PageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamPage({ params }: PageProps) {
  const { examId } = await params
  const supabase = await createServerSupabaseClient()
  const student = await getStudentProfile()

  if (!student) redirect('/login')

  const { data: exam } = await supabase
    .from('exams')
    .select('id, nama_ujian, waktu_mulai, durasi_menit')
    .eq('id', examId)
    .single()

  if (!exam) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, teks_soal, urutan')
    .eq('exam_id', examId)
    .order('urutan', { ascending: true })

  const questionIds = (questions ?? []).map((q) => q.id)

  const { data: options } = await supabase
    .from('question_options')
    .select('id, question_id, teks_opsi, is_correct')
    .in('question_id', questionIds.length > 0 ? questionIds : [''])

  // Gabungkan soal dengan opsinya
  const questionsWithOptions = (questions ?? []).map((q) => ({
    ...q,
    question_options: (options ?? []).filter((o) => o.question_id === q.id),
  }))

  // Cek atau buat exam_result
  let { data: result } = await supabase
    .from('exam_results')
    .select('id, status, jumlah_pelanggaran, mulai_at')
    .eq('student_id', student.id)
    .eq('exam_id', examId)
    .single()

  if (!result) {
    const { data: newResult } = await supabase
      .from('exam_results')
      .insert({
        student_id: student.id,
        exam_id: examId,
        status: 'belum_mulai',
        total_skor: 0,
        jumlah_pelanggaran: 0,
        mulai_at: null,
        selesai_at: null,
      })
      .select('id, status, jumlah_pelanggaran, mulai_at')
      .single()
    result = newResult
  }

  if (result?.status === 'selesai') redirect(`/exam/result?examId=${examId}`)

  return (
    <ExamClient
      exam={{ ...exam, questions: questionsWithOptions }}
      student={student}
      examResultId={result!.id}
    />
  )
}
