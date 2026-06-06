// src/lib/auth/student.ts
// =============================================================
// STRATEGI AUTENTIKASI MURID (NISN)
//
// Pendekatan yang dipilih: "Fake Email" via signInWithPassword
//
// ALASAN:
// - Supabase Auth bawaan sudah menangani JWT, session, refresh token.
// - Tidak perlu custom session management atau JWT signing sendiri.
// - NISN diubah menjadi format email palsu: {nisn}@cbt.internal
// - Password default saat registrasi = NISN itu sendiri (admin bisa reset).
//
// ALTERNATIF (tidak dipilih):
// 1. Custom Claims: Lebih kompleks, butuh Edge Function untuk sign JWT.
// 2. Tabel custom + cookie manual: Berisiko dari sisi keamanan session.
// =============================================================

'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const toFakeEmail = (nisn: string) => `${nisn}@cbt.internal`

// ---
// Registrasi murid baru (dipanggil oleh admin, bukan murid langsung)
// ---
export async function registerStudent(params: {
  nisn: string
  nama: string
  kelas: string
}) {
  const supabase = createServiceRoleClient()

  // 1. Buat akun di Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: toFakeEmail(params.nisn),
    password: params.nisn, // Default password = NISN
    email_confirm: true,   // Skip konfirmasi email
    user_metadata: { role: 'student' },
  })

  if (authError || !authData.user) {
    throw new Error(`Gagal membuat akun auth: ${authError?.message}`)
  }

  // 2. Simpan profil ke tabel students
  const { error: profileError } = await supabase.from('students').insert({
    id: authData.user.id, // Samakan ID dengan auth.users
    nisn: params.nisn,
    nama: params.nama,
    kelas: params.kelas,
  })

  if (profileError) {
    // Rollback: hapus user auth jika insert profil gagal
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(`Gagal menyimpan profil: ${profileError.message}`)
  }

  return authData.user
}

// ---
// Login murid dengan NISN (Server Action)
// ---
export async function loginWithNISN(nisn: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: toFakeEmail(nisn),
    password: nisn,
  })

  if (error) {
    return { error: 'NISN tidak ditemukan atau tidak valid.' }
  }

  redirect('/exam')
}

// ---
// Ambil profil murid yang sedang login (Server Component)
// ---
export async function getStudentProfile() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, nisn, nama, kelas')
    .eq('id', user.id)
    .single()

  return student
}

// ---
// Logout
// ---
export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
