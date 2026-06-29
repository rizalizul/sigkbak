# SIGKBAK - Sistem Informasi Geografis Kawasan Bentang Alam Karst

SIGKBAK adalah aplikasi Sistem Informasi Geografis (SIG) berbasis web yang dirancang untuk memetakan, mengelola, dan memvisualisasikan data spasial Kawasan Bentang Alam Karst (KBAK). Aplikasi ini dilengkapi dengan fitur manajemen data spasial (Unggah & Edit Atribut), visualisasi layer dinamis, kontrol filter, serta halaman manajemen Admin.

## 🚀 Teknologi Utama

Aplikasi ini dibangun menggunakan ekosistem modern berikut:
- **Frontend:** React.js + Vite
- **Styling:** Tailwind CSS + PostCSS
- **Database & Auth:** Supabase
- **Penyimpanan Gambar:** Cloudinary
- **Peta/Spasial:** GeoJSON (`kbak.geojson`)

---

## 📋 Prasyarat Sistem (Requirements)

Sebelum menjalankan proyek ini secara lokal, pastikan perangkat Anda telah memenuhi atau menginstal kebutuhan berikut:

1. **Node.js**
   - Versi yang direkomendasikan: **Node.js v18.x** atau versi LTS terbaru.
   - Cek versi Node.js Anda di terminal dengan perintah: `node -v`
2. **NPM (Node Package Manager)**
   - Biasanya otomatis terinstal bersama Node.js.
   - Cek versi dengan perintah: `npm -v`
3. **Browser Modern**
   - Google Chrome, Mozilla Firefox, atau Microsoft Edge versi terbaru (mendukung WebGL untuk performa rendering peta).
4. **Koneksi Internet**
   - Diperlukan untuk sinkronisasi data dengan database Supabase secara real-time.

---
## 🔑 Konfigurasi Variabel Lingkungan (.env)

Aplikasi ini memerlukan konfigurasi environment variabel untuk terhubung dengan Supabase dan Cloudinary. 

1. Duplikat atau ubah nama file `.env.example` yang ada di root direktori menjadi `.env`.
2. Buka file `.env` tersebut dan pastikan variabel berikut sudah terisi dengan benar sesuai kredensial layanan Anda:

```text
VITE_SUPABASE_URL=https://dvtjodtuyhyeksqzuvzh.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_CLOUDINARY_CLOUD_NAME=djz67oliz
VITE_CLOUDINARY_UPLOAD_PRESET=kbak_photos
```

## 🛠️ Langkah Instalasi & Cara Menjalankan

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di laptop Anda:

### 1. Ekstrak file / Clone Repositori
Jika Anda mendapatkan file ini dalam bentuk ZIP, ekstrak terlebih dahulu ke folder pilihan Anda. Jika menggunakan Git, jalankan perintah:
```bash
git clone https://github.com/rizalizul/sigkbak.git
cd sigkbak
```

### 2. Install Dependensi (Library)
Buka terminal atau command prompt di dalam folder proyek `sigkbak`, lalu jalankan perintah berikut untuk mengunduh semua library yang dibutuhkan:
```bash
npm install
```
*Catatan: Jika terjadi masalah konflik versi dependensi saat instalasi, gunakan perintah alternatif: `npm install --legacy-peer-deps`*

### 3. Jalankan Aplikasi dalam Mode Pengembangan (Development)
Setelah instalasi selesai, jalankan server lokal dengan perintah:
```bash
npm run dev
```

### 4. Buka di Browser
Setelah server berjalan, terminal akan menampilkan alamat URL lokal. Biasanya aplikasi dapat diakses melalui:
```bash
http://localhost:5173/
```
Buka tautan tersebut di browser Anda untuk melihat aplikasi secara langsung.

## 🏗️ Struktur Proyek
```
sigkbak
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ data
│  │  └─ kbak.geojson      # Data spasial utama KBAK
│  ├─ favicon.svg
│  ├─ icons.svg
│  └─ logo.png
├─ src
│  ├─ App.jsx
│  ├─ assets               # Aset gambar statis
│  ├─ components           # Komponen reusable (Map, Sidebar, UI, Upload)
│  ├─ constants            # Konfigurasi peta bawaan
│  ├─ hooks               # Custom hooks untuk state & integrasi Supabase
│  ├─ lib
│  │  └─ supabase.js       # Konfigurasi & inisialisasi Supabase client
│  ├─ main.jsx
│  ├─ pages                # Halaman aplikasi (Public Map, Login, Admin Dashboard)
│  ├─ router               # Pengaturan rute halaman (React Router)
│  └─ utils                # Fungsi pembantu (parser file, marker helper)
├─ tailwind.config.js
├─ vercel.json             # Konfigurasi deployment untuk Vercel
└─ vite.config.js
```

## 📦 Produksi & Deployment
Jika ingin melakukan kompilasi aplikasi untuk siap diunggah ke hosting/produksi:
```bash
npm run build
```
Hasil kompilasi final berupa file HTML, CSS, dan JS statis akan berada di dalam folder `dist/.`
