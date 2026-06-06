// src/lib/supabase/types.ts
// Generated manually — sesuaikan dengan output `supabase gen types typescript`

export type ExamStatus = 'belum_mulai' | 'mengerjakan' | 'selesai'

export type CheatType =
  | 'keluar_fullscreen'
  | 'pindah_tab'
  | 'blur_window'
  | 'klik_kanan'
  | 'shortcut_copy'
  | 'shortcut_paste'
  | 'devtools_shortcut'

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          nisn: string
          nama: string
          kelas: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      admins: {
        Row: {
          id: string
          nama: string
          email: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
      }
      exams: {
        Row: {
          id: string
          nama_ujian: string
          waktu_mulai: string
          durasi_menit: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          teks_soal: string
          urutan: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['questions']['Insert']>
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          teks_opsi: string
          is_correct: boolean
        }
        Insert: Omit<Database['public']['Tables']['question_options']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['question_options']['Insert']>
      }
      exam_results: {
        Row: {
          id: string
          student_id: string
          exam_id: string
          total_skor: number
          status: ExamStatus
          jumlah_pelanggaran: number
          mulai_at: string | null
          selesai_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exam_results']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exam_results']['Insert']>
      }
      student_answers: {
        Row: {
          id: string
          exam_result_id: string
          question_id: string
          selected_option_id: string | null
          answered_at: string
        }
        Insert: Omit<Database['public']['Tables']['student_answers']['Row'], 'id' | 'answered_at'>
        Update: Partial<Database['public']['Tables']['student_answers']['Insert']>
      }
      cheat_logs: {
        Row: {
          id: string
          student_id: string
          exam_id: string
          jenis_pelanggaran: CheatType
          keterangan: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cheat_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
