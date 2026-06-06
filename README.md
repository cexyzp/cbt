# CBT (Computer Based Test) — Blueprint & Boilerplate

## Tech Stack
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Frontend**: Next.js 14 App Router + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## Struktur File

```
cbt-app/
├── src/
│   ├── app/
│   │   ├── login/page.tsx              # Login murid via NISN
│   │   ├── exam/
│   │   │   ├── [examId]/
│   │   │   │   ├── page.tsx            # Server Component — fetch data ujian
│   │   │   │   └── ExamClient.tsx      # Client Component — interaksi ujian
│   │   │   └── result/page.tsx         # Halaman hasil
│   │   └── admin/...
│   ├── components/exam/
│   │   ├── ExamShell.tsx               # Wrapper anti-cheat + UI status
│   │   ├── QuestionCard.tsx            # Kartu soal + pilihan jawaban
│   │   ├── TimerBar.tsx                # Countdown timer responsif
│   │   └── ViolationBadge.tsx          # Indikator pelanggaran di header
│   ├── hooks/
│   │   └── useAntiCheat.ts             # Core anti-cheat hook
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts               # Browser Supabase client
│       │   ├── server.ts               # Server + Service Role client
│       │   └── types.ts                # TypeScript types dari skema DB
│       └── auth/
│           └── student.ts              # Login/register/logout murid
├── supabase/
│   └── schema.sql                      # DDL lengkap — jalankan di SQL Editor
├── .env.local.example
└── package.json
```

---

## Setup Cepat

### 1. Clone & Install
```bash
npx create-next-app@latest cbt-app --typescript --tailwind --app
cd cbt-app
npm install @supabase/ssr @supabase/supabase-js lucide-react
```

### 2. Konfigurasi Supabase
```bash
cp .env.local.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 3. Jalankan DDL
Buka Supabase Dashboard > SQL Editor, paste isi supabase/schema.sql, lalu Run.

### 4. Salin file boilerplate
Salin semua file dari blueprint ini ke dalam proyek Next.js Anda.

### 5. Jalankan
```bash
npm run dev
```

---

## Arsitektur Autentikasi Murid

**Strategi: Fake Email via signInWithPassword**

NISN dikonversi menjadi email palsu format {nisn}@cbt.internal.
Password default = NISN itu sendiri. Pendekatan ini memanfaatkan seluruh
infrastruktur session Supabase (JWT, refresh token, cookie) tanpa perlu
custom session management.

```
Login Flow:
NISN input -> toFakeEmail(nisn) -> supabase.auth.signInWithPassword
-> Supabase Auth (auth.users) -> Session cookie -> redirect /exam
```

Registrasi murid dilakukan oleh admin via registerStudent() menggunakan
service_role key — murid tidak bisa daftar sendiri.

---

## Sistem Anti-Cheat

Hook useAntiCheat menangani 5 jenis perlindungan:

| Perlindungan   | Event/API             | Jenis Pelanggaran     |
|----------------|-----------------------|-----------------------|
| Fullscreen     | fullscreenchange      | keluar_fullscreen     |
| Tab switching  | visibilitychange      | pindah_tab            |
| Window blur    | window.blur           | blur_window           |
| Klik kanan     | contextmenu           | klik_kanan            |
| Copy/Paste     | keydown (Ctrl+C/V)    | shortcut_copy/paste   |
| DevTools       | keydown (F12, etc.)   | devtools_shortcut     |

Setiap pelanggaran langsung disimpan ke tabel cheat_logs secara async
(fire-and-forget). Setelah 3 pelanggaran, onForceSubmit dipanggil otomatis.

---

## Palet Warna

| Konteks          | Warna Tailwind                  |
|------------------|---------------------------------|
| Background       | slate-950, slate-900            |
| Border           | slate-800, slate-700            |
| Aksen utama      | indigo-600, indigo-500          |
| Teks primer      | slate-100                       |
| Teks sekunder    | slate-400, slate-500            |
| Sukses / Lulus   | emerald-400, emerald-600        |
| Pelanggaran      | rose-400, rose-600              |
| Peringatan       | amber-400, amber-500            |

---

## Catatan Keamanan

1. SUPABASE_SERVICE_ROLE_KEY hanya boleh digunakan di server-side.
2. RLS sudah diaktifkan — aktifkan policy setelah auth dikonfigurasi.
3. Anti-cheat client-side adalah lapisan UX, bukan keamanan mutlak.
4. Auto-save jawaban pakai upsert — koneksi putus tidak menghilangkan progres.
