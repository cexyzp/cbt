-- =============================================================
-- CBT (Computer Based Test) — Supabase PostgreSQL DDL
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =============================================================

-- Enable UUID extension (sudah aktif di Supabase, tapi defensive)
create extension if not exists "pgcrypto";

-- =============================================================
-- 1. STUDENTS
-- =============================================================
create table public.students (
  id          uuid primary key default gen_random_uuid(),
  nisn        text not null unique,
  nama        text not null,
  kelas       text not null,
  created_at  timestamptz not null default now()
);

comment on table public.students is 'Data murid peserta ujian';
comment on column public.students.nisn is 'Nomor Induk Siswa Nasional — digunakan sebagai kredensial login';

-- =============================================================
-- 2. ADMINS
-- Catatan: admin menggunakan Supabase Auth bawaan (email/password).
-- Tabel ini adalah profil tambahan yang terhubung ke auth.users.
-- =============================================================
create table public.admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  nama        text not null,
  email       text not null unique,
  created_at  timestamptz not null default now()
);

comment on table public.admins is 'Profil admin, terhubung ke Supabase Auth (auth.users)';

-- =============================================================
-- 3. EXAMS
-- =============================================================
create table public.exams (
  id            uuid primary key default gen_random_uuid(),
  nama_ujian    text not null,
  waktu_mulai   timestamptz not null,
  durasi_menit  integer not null check (durasi_menit > 0),
  created_at    timestamptz not null default now()
);

comment on table public.exams is 'Data ujian / paket soal';

-- =============================================================
-- 4. QUESTIONS
-- =============================================================
create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references public.exams(id) on delete cascade,
  teks_soal   text not null,
  urutan      integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.questions is 'Butir soal yang tergabung dalam sebuah ujian';
create index idx_questions_exam_id on public.questions(exam_id);

-- =============================================================
-- 5. QUESTION OPTIONS
-- =============================================================
create table public.question_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.questions(id) on delete cascade,
  teks_opsi    text not null,
  is_correct   boolean not null default false
);

comment on table public.question_options is 'Pilihan jawaban per soal (A/B/C/D/E)';
create index idx_question_options_question_id on public.question_options(question_id);

-- =============================================================
-- 6. EXAM RESULTS
-- =============================================================
create type public.exam_status as enum (
  'belum_mulai',
  'mengerjakan',
  'selesai'
);

create table public.exam_results (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references public.students(id) on delete cascade,
  exam_id              uuid not null references public.exams(id) on delete cascade,
  total_skor           integer not null default 0,
  status               public.exam_status not null default 'belum_mulai',
  jumlah_pelanggaran   integer not null default 0,
  mulai_at             timestamptz,
  selesai_at           timestamptz,
  created_at           timestamptz not null default now(),
  unique (student_id, exam_id)
);

comment on table public.exam_results is 'Hasil dan progres ujian per murid';
create index idx_exam_results_student_id on public.exam_results(student_id);
create index idx_exam_results_exam_id on public.exam_results(exam_id);

-- =============================================================
-- 7. STUDENT ANSWERS (jawaban per soal — untuk review)
-- =============================================================
create table public.student_answers (
  id                  uuid primary key default gen_random_uuid(),
  exam_result_id      uuid not null references public.exam_results(id) on delete cascade,
  question_id         uuid not null references public.questions(id) on delete cascade,
  selected_option_id  uuid references public.question_options(id) on delete set null,
  answered_at         timestamptz not null default now(),
  unique (exam_result_id, question_id)
);

comment on table public.student_answers is 'Jawaban murid per butir soal';
create index idx_student_answers_exam_result_id on public.student_answers(exam_result_id);

-- =============================================================
-- 8. CHEAT LOGS
-- =============================================================
create type public.cheat_type as enum (
  'keluar_fullscreen',
  'pindah_tab',
  'blur_window',
  'klik_kanan',
  'shortcut_copy',
  'shortcut_paste',
  'devtools_shortcut'
);

create table public.cheat_logs (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students(id) on delete cascade,
  exam_id             uuid not null references public.exams(id) on delete cascade,
  jenis_pelanggaran   public.cheat_type not null,
  keterangan          text,
  created_at          timestamptz not null default now()
);

comment on table public.cheat_logs is 'Log setiap pelanggaran anti-cheat selama ujian berlangsung';
create index idx_cheat_logs_student_exam on public.cheat_logs(student_id, exam_id);
create index idx_cheat_logs_created_at on public.cheat_logs(created_at);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

-- Students: tidak boleh baca data murid lain
alter table public.students enable row level security;
alter table public.admins enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.exam_results enable row level security;
alter table public.student_answers enable row level security;
alter table public.cheat_logs enable row level security;

-- Policy helper: cek apakah request datang dari service role (server-side)
-- Untuk murid yang login via custom session (JWT custom claim), sesuaikan policy ini
-- dengan pendekatan autentikasi yang dipilih (lihat auth/student.ts).

-- Contoh policy untuk exam_results: murid hanya bisa baca hasil sendiri
-- (Aktifkan setelah custom auth dikonfigurasi)
-- create policy "murid baca hasil sendiri"
--   on public.exam_results for select
--   using (student_id = (current_setting('app.student_id', true))::uuid);

-- Untuk sementara, akses melalui service_role key di server (Next.js API routes).
-- Aktifkan RLS policy bertahap setelah auth selesai dikonfigurasi.

-- =============================================================
-- SEED DATA (opsional — untuk development/testing)
-- =============================================================

-- insert into public.students (nisn, nama, kelas) values
--   ('1234567890', 'Budi Santoso', 'XII IPA 1'),
--   ('0987654321', 'Siti Rahayu', 'XII IPA 2');

-- insert into public.exams (nama_ujian, waktu_mulai, durasi_menit) values
--   ('Ujian Matematika Semester Ganjil', now() + interval '1 day', 90);
